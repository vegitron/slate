from django.db import models
from django.core.urlresolvers import reverse
from django.conf import settings
from datetime import datetime
import simplejson as json
import random
import hashlib
import base64
from slate.search import DBBackend

class Artboard(models.Model):
    name = models.CharField(max_length=150)
    url_token = models.CharField(max_length=100, unique=True, db_index=True)

    def initial_json_data(self):
        test_date = datetime.now()

        data = {
            "date": test_date.isoformat(),
            "name": self.name,
            "layers": [],
            "shapes": [],
        }

        layers = Layer.objects.filter(artboard = self, creation_date__lt=test_date)
        for layer in layers:
            data["layers"].append(layer.json_data())

        shapes = Shape.objects.filter(artboard = self, creation_date__lt=test_date)
        for shape in shapes:
            data["shapes"].append(shape.json_data())


        return data

    def json_data_after_date(self, test_date):
        new_test_date = datetime.now()
        data = {
            "date": new_test_date.isoformat(),
            "name": self.name,
            "layers": [],
            "shapes": [],
            "modified_layers": [],
            "modified_shapes": [],
        }

        layers = Layer.objects.filter(artboard = self, modification_date__gt = test_date, modification_date__lt = new_test_date)
        for layer in layers:
            if layer.creation_date > test_date:
                data["layers"].append(layer.json_data())
            else:
                data["modified_layers"].append(layer.json_data())

        shapes = Shape.objects.filter(artboard = self, modification_date__gt = test_date, modification_date__lt = new_test_date)
        for shape in shapes:
            if shape.creation_date > test_date:
                data["shapes"].append(shape.json_data())
            else:
                data["modified_shapes"].append(shape.json_data())


        return data



    def save(self, *args, **kwargs):
        if not self.url_token:
            token_base = "%s--%s--%s" % (random.random(), datetime.now(), self.name)

            hashed = hashlib.sha1(token_base).digest()

            encoded = base64.urlsafe_b64encode(hashed)

            self.url_token = encoded

        super(Artboard, self).save(*args, **kwargs)

    def get_url(self):
        return reverse('slate.views.whiteboard', kwargs={ "url_token": self.url_token })


    def get_url_for_position(self, x, y):
        return reverse('slate.views.whiteboard', kwargs={ "url_token": self.url_token, 'x_pos': x, 'y_pos': y })


    @staticmethod
    def search(query_string):
        if hasattr(settings, "SLATE_SEARCH_BACKEND"):
            # This is all taken from django's static file finder
            module, attr = getattr(settings, "SLATE_SEARCH_BACKEND").rsplit('.', 1)
            try:
                mod = import_module(module)
            except ImportError, e:
                raise ImproperlyConfigured('Error importing module %s: "%s"' %
                                           (module, e))
            try:
                search_module = getattr(mod, attr)
            except AttributeError:
                raise ImproperlyConfigured('Module "%s" does not define a '
                                   '"%s" class' % (module, attr))

            search_backend = search_module()
        else:
            search_backend = DBBackend()

        return search_backend.query(query_string)

class Layer(models.Model):
    name = models.CharField(max_length=150)
    z_index = models.IntegerField()
    artboard = models.ForeignKey(Artboard)
    modification_date = models.DateTimeField(db_index = True)
    creation_date = models.DateTimeField(db_index = True)

    def json_data(self):
        return {
            'name': self.name,
            'z_index': self.z_index,
            'id': self.pk,
        }


    def save(self, *args, **kwargs):
        self.modification_date = datetime.now()
        if not self.creation_date:
            self.creation_date = datetime.now()

        super(Layer, self).save(*args, **kwargs)

class Shape(models.Model):
    artboard = models.ForeignKey(Artboard)
    layer = models.ForeignKey(Layer)
    type = models.CharField(max_length=50)
    z_index = models.IntegerField()
    json_definition = models.TextField()
    modification_date = models.DateTimeField(db_index = True)
    creation_date = models.DateTimeField(db_index = True)

    # Any shape type that has a text value - text goes into search_content,
    # and the origin to use when displaying that search content goes into
    # the x and y pos values.
    search_content = models.CharField(max_length=1000)
    search_content_xpos = models.IntegerField(null=True)
    search_content_ypos = models.IntegerField(null=True)
    def json_data(self):
        return {
            'type': self.type,
            'layer_id': self.layer.pk,
            'z_index': self.z_index,
            'shape_definition': json.loads(self.json_definition),
            'id': self.pk,
        }

    def save(self, *args, **kwargs):
        self.modification_date = datetime.now()

        if not self.creation_date:
            self.creation_date = datetime.now()
        super(Shape, self).save(*args, **kwargs)


from django.db import models
from django.core.urlresolvers import reverse
from datetime import datetime
import simplejson as json
import random
import hashlib
import base64

class Artboard(models.Model):
    name = models.CharField(max_length=150)
    url_token = models.CharField(max_length=100, unique=True, db_index=True)

    def initial_json_data(self):
        test_date = datetime.now()

        data = {
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

    def save(self, *args, **kwargs):
        if not self.url_token:
            token_base = "%s--%s--%s" % (random.random(), datetime.now(), self.name)

            hashed = hashlib.sha1(token_base).digest()

            encoded = base64.urlsafe_b64encode(hashed)

            self.url_token = encoded

        super(Artboard, self).save(*args, **kwargs)

    def get_url(self):
        return reverse('slate.views.whiteboard', kwargs={ "url_token": self.url_token })

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
    search_content = models.CharField(max_length=1000)
    json_definition = models.TextField()
    modification_date = models.DateTimeField(db_index = True)
    creation_date = models.DateTimeField(db_index = True)

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


# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect, HttpResponse
import simplejson as json
from slate.models import Artboard, Layer, Shape

def home(request):
    artboards = Artboard.objects.all()

    artboard_data = []

    for artboard in artboards:
        artboard_data.append({
            'name': artboard.name,
            'url_token': artboard.url_token,
        })

    return render_to_response("home.html", {
        "artboards": artboard_data,
    }, RequestContext(request))

def create_whiteboard(request):
    if request.method == "POST":
        artboard = Artboard.objects.create(name=request.POST["name"])

        layer = Layer.objects.create(
            name = "Layer 1",
            artboard = artboard,
            z_index = 1,
        )
        return HttpResponseRedirect(artboard.get_url())

    return render_to_response("create.html", {}, RequestContext(request))

def whiteboard(request, url_token):
    artboard = Artboard.objects.get(url_token = url_token)

    return render_to_response("artboard.html", {
        "url_token": url_token,
    }, RequestContext(request))



def shape(request, url_token, shape_id=None):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        json_data = json.loads(request.raw_post_data)

        layer = Layer.objects.get(pk = json_data["layer_id"])
        if not (layer.artboard.pk == artboard.pk):
            raise("Invalid layer id for shape")

        shape = Shape.objects.create(
            artboard = artboard,
            layer = layer,
            type = json_data["type"],
            z_index = json_data["z_index"],
            json_definition = json.dumps(json_data["shape_definition"]),
        )

        if json_data["type"] == "text":
            shape.search_content = json_data["shape_definition"]["text"]
            shape.save()

    elif request.method == "PUT":
        pass

    else:
        shape = Shape.objects.get(pk = shape_id)

    if not (shape.artboard.pk == artboard.pk):
        raise("Invalid url_token for shape")


    return HttpResponse(json.dumps(shape.json_data()), content_type="application/json")

def layer(request, url_token, layer_id=None):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        json_data = json.loads(request.raw_post_data)

        print "JS: ", json_data

        layer = Layer.objects.create(
            artboard = artboard,
            name = json_data["name"],
            z_index = json_data["z_index"],
        )

    elif request.method == "PUT":
        pass

    else:
        layer = Layer.objects.get(pk = layer_id)

    if not (layer.artboard.pk == artboard.pk):
        raise("Invalid url_token for layer")


    return HttpResponse(json.dumps(layer.json_data()), content_type="application/json")

def artboard(request, url_token):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        pass

    elif request.method == "PUT":
        pass

    elif request.method == "GET":
        return HttpResponse(json.dumps(artboard.initial_json_data()), content_type="application/json")


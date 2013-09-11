# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect, HttpResponse
import simplejson as json
import dateutil.parser
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

def search(request):
    results = Artboard.search(request.GET["q"])

    return render_to_response("search_results.html", { 'results': results }, RequestContext(request))

def whiteboard(request, url_token, x_pos=0, y_pos=0):
    artboard = Artboard.objects.get(url_token = url_token)

    return render_to_response("artboard.html", {
        "url_token": url_token,
        "name": artboard.name,
    }, RequestContext(request))



def shape(request, url_token, shape_id=None):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        json_data = json.loads(request.body)

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
            shape.search_content = json_data["shape_definition"]["values"]["text"]
            shape.search_content_xpos = json_data["shape_definition"]["values"]["x"]
            shape.search_content_ypos = json_data["shape_definition"]["values"]["y"]
            shape.save()

    elif request.method == "PUT":
        shape = Shape.objects.get(pk = shape_id)
        json_data = json.loads(request.body)

        if not (shape.artboard.pk == artboard.pk):
            raise("Invalid artboard id for shape")

        layer = Layer.objects.get(pk = json_data["layer_id"])
        if not (layer.artboard.pk == artboard.pk):
            raise("Invalid layer id for shape")

        shape.layer = layer
        shape.z_index = json_data["z_index"]
        shape.json_definition = json.dumps(json_data["shape_definition"])

        if json_data["type"] == "text":
            shape.search_content = json_data["shape_definition"]["values"]["text"]
            shape.search_content_xpos = json_data["shape_definition"]["values"]["x"]
            shape.search_content_ypos = json_data["shape_definition"]["values"]["y"]

        shape.save()
        pass

    else:
        shape = Shape.objects.get(pk = shape_id)

    if request.method == "DELETE":
        shape.delete()
        return HttpResponse('', content_type="application/json", status=204)

    if not (shape.artboard.pk == artboard.pk):
        raise("Invalid url_token for shape")


    return HttpResponse(json.dumps(shape.json_data()), content_type="application/json")

def layer(request, url_token, layer_id=None):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        json_data = json.loads(request.body)

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

    if request.method == "DELETE":
        layer.delete()
        return HttpResponse('', content_type="application/json", status=204)

    return HttpResponse(json.dumps(layer.json_data()), content_type="application/json")

def artboard(request, url_token):
    artboard = Artboard.objects.get(url_token = url_token)

    if request.method == "POST":
        pass

    elif request.method == "PUT":
        pass

    elif request.method == "GET":
        return HttpResponse(json.dumps(artboard.initial_json_data()), content_type="application/json")

def artboard_updates(request, url_token, date_from):
    artboard = Artboard.objects.get(url_token = url_token)
    date = dateutil.parser.parse(date_from)

    return HttpResponse(json.dumps(artboard.json_data_after_date(date)), content_type="application/json")


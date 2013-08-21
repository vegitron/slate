# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect
from slate.models import Artboard

def demo(request):
    return render_to_response("demo.html", {}, RequestContext(request))

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
        return HttpResponseRedirect(artboard.get_url())

    return render_to_response("create.html", {}, RequestContext(request))

def whiteboard(request, url_token):
    return render_to_response("demo.html", {
    }, RequestContext(request))


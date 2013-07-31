# Create your views here.
from django.shortcuts import render_to_response
from django.template import RequestContext

def demo(request):
    return render_to_response("demo.html", {}, RequestContext(request))


from django.conf.urls import patterns, url

urlpatterns = patterns('',
    url(r'^$', 'slate.views.home'),
    url(r'^new$', 'slate.views.create_whiteboard'),
    url(r'^search$', 'slate.views.search'),
    url(r'^board/(?P<url_token>[^/]+)', 'slate.views.whiteboard'),
    url(r'^board/(?P<url_token>[^/]+)/(?P<x_pos>[\-0-9]+),(?P<y_pos>[\-0-9]+)', 'slate.views.whiteboard'),

    # These should probably be moved to socket.io!
    url(r'^rest/artboard/(?P<url_token>.*)/from/(?P<date_from>.*)$', 'slate.views.artboard_updates'),
    url(r'^rest/artboard/(?P<url_token>.*)$', 'slate.views.artboard'),

    url(r'^rest/layer/(?P<url_token>.*)/(?P<layer_id>[0-9]+)$', 'slate.views.layer'),
    url(r'^rest/layer/(?P<url_token>.*)$', 'slate.views.layer'),

    url(r'^rest/shape/(?P<url_token>.*)/(?P<shape_id>[0-9]+)$', 'slate.views.shape'),
    url(r'^rest/shape/(?P<url_token>.*)$', 'slate.views.shape'),
)

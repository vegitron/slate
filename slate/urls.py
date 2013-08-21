from django.conf.urls import patterns, url

urlpatterns = patterns('',
    url(r'^$', 'slate.views.home'),
    url(r'^new$', 'slate.views.create_whiteboard'),
    url(r'^board/(?P<url_token>.*)$', 'slate.views.whiteboard'),
)

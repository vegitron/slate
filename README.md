slate
=====

A shared whiteboard

Installation Instructions
-------------------------

$ git clone https://github.com/vegitron/slate.git

$ virtualenv --no-site-packages slate

$ cd slate/

$ source bin/activate

(slate)$ pip install -r requirements.txt

(slate)$ python manage.py startproject project .

edit project/urls.py

Add: `url(r'^', include('slate.urls')),`

edit project/settings.py

Add: 

    INSTALLED_APPS = (..., 
    'slate',
    'templatetag_handlebars')

(slate)$ python manage.py runserver

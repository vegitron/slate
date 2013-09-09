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

(slate)$ django-admin.py startproject project .

edit project/urls.py

Add: `url(r'^', include('slate.urls')),`

edit project/settings.py

**Add:**

    INSTALLED_APPS = (..., 
    'slate',
    'templatetag_handlebars')
**Edit DATABASES**

    'ENGINE': 'django.db.backends.sqlite3'
    'NAME': '[name of DB file (eg db.sqlite)]',

(slate)$ python manage.py syncdb

(slate)$ python manage.py runserver

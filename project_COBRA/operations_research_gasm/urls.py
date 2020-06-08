from django.urls import path

from . import views

#'salesman' is older version without vue
urlpatterns = [
    path('salesman', views.salesman, name='salesman'),
    path('salesman_optimization', views.salesman_optimization, name='salesman_optimization'),
    path('tsm', views.tsm, name='tsm')
]
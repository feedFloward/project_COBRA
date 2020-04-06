from django.urls import path

from . import views

urlpatterns = [
    path('salesman', views.salesman, name='salesman'),
    path('salesman_optimization', views.salesman_optimization, name='salesman_optimization')
]
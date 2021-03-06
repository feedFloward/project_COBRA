from django.urls import path

from . import views

urlpatterns = [
    path('ml_fiddle_classification', views.classification_page, name='classification_in_ml_fiddle'),
    path('ml_fiddle_clustering', views.clustering_page, name='clustering_in_ml_fiddle'),
    path('ml_fiddle_timeries', views.timeseries_page, name='timeseries_in_ml_fiddle'),
    path('regression', views.regression_page, name='regression_in_ml_fiddle'),
    path('train_classifier', views.make_classification, name='process datapoints'),
    path('train_clustering', views.make_clustering, name='make clustering'),
    path('train_regression', views.make_regression, name='make regression')
]
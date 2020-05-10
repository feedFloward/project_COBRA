from django.urls import path

from . import views

urlpatterns = [
    path('food101', views.food, name='food'),
    path('post/', views.CreatePostView.as_view(), name='add_post'),
    path('predict_food', views.make_prediction, name='predict food')
]
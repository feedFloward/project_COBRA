from django.shortcuts import render
from django.http import HttpResponseRedirect, HttpResponse
from django.views.generic import CreateView
from django.urls import reverse_lazy, reverse

import os
import json

from .models import Image_Post
from .forms import Post_Form
from food101.src.inference import predict

# Create your views here.

def food(request):
    if Image_Post.objects.all():
        image = Image_Post.objects.all()[0]
    else:
        image = None
    return render(request, 'food.html', {'image': image})

def make_prediction(request):
    if request.method == "POST":
        img = Image_Post.objects.all()[0].img.url
        prediction = predict(img)
        return HttpResponse(json.dumps(prediction), content_type="application/json")


class CreatePostView(CreateView):
    model = Image_Post
    form_class = Post_Form
    template_name = 'post.html'
    # success_url = reverse_lazy('food')

    def form_valid(self, form):
        Image_Post.objects.all().delete()
        for f in os.listdir('media/images/'):
            if f == '.gitkeep':
                pass
            else:
                os.remove('media/images/'+f)
        self.object = form.save()
        return HttpResponseRedirect('/food101')
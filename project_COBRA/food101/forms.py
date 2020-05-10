from django import forms
from .models import Image_Post

class Post_Form(forms.ModelForm):

    class Meta:
        model = Image_Post
        fields = ['img']
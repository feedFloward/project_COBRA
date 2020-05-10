from django.db import models

# Create your models here.

class Image_Post(models.Model):
    img = models.ImageField(upload_to='images/')
    
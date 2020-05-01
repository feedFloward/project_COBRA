from django.shortcuts import render
from django.http import HttpResponse
from ml_fiddle.src.ml_models import Classifier, Regression
from ml_fiddle.src.clustering import Clustering

import json

def ml_fiddle_home(request):
    return render(request, '_static/home.html')

def classification_page(request):
    return render(request, 'ml_fiddle/classification.html')

def clustering_page(request):
    return render(request, 'ml_fiddle/ml_fiddle_clustering.html')

def timeseries_page(request):
    return render(request, 'ml_fiddle/ml_fiddle_timeseries.html')

def regression_page(request):
    return render(request, 'ml_fiddle/regression.html')

def make_classification(request):
    if request.method == "POST":
        get_values = request.body
        values_dict = json.loads(get_values)
        clf = Classifier(input_dict= values_dict)
        clf.fit()
        predictions = clf.predict()
        
        return HttpResponse(json.dumps(predictions), content_type="application/json")

def make_clustering(request):
    if request.method == "POST":
        get_values = request.body
        values_dict = json.loads(get_values)
        clst = Clustering()
        clst.fit(data= values_dict)
        predictions = clst.predict()
    return HttpResponse(json.dumps(predictions), content_type="application/json")

def make_regression(request):
    if request.method == "POST":
        get_values = request.body
        values_dict = json.loads(get_values)
        regression = Regression(input_dict= values_dict)
        regression.fit()
        predictions = regression.predict()
        print(predictions)
    
    return HttpResponse(json.dumps(predictions), content_type="application/json")
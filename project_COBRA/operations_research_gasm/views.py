from django.shortcuts import render
from django.http import HttpResponse

from operations_research_gasm.src.optimization import Optimization
import json

# Create your views here.

#'salesman' is older version without vue
def salesman(request):
    return render(request, 'operations_research_gasm/salesman.html')

def salesman_optimization(request):
    if request.method == "POST":
        get_values = request.body
        values_dict = json.loads(get_values)
        opt = Optimization(values_dict)
        solution = opt.optimize()
        return HttpResponse(json.dumps(solution), content_type="application/json")
    
def tsm(request):
    return render(request, 'operations_research_gasm/tsm.html')
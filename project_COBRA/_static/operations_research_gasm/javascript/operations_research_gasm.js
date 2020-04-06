var post_url = "http://127.0.0.1:8000"
var cities = []
var current_city

var canv = document.getElementById("inputspace_canvas")
var canv_ctx = canv.getContext("2d")

var replay_data

canv.width = document.getElementById("inputspace_div").clientWidth
canv.height = document.getElementById("inputspace_div").clientHeight

const color_dict = {
    0 : "blue"
}

class City {
    constructor() {
        this.color = color_dict[cities.length]
    }

    make_city(e) {
        this.x = e.offsetX
        this.y = e.offsetY
        redraw_canvas()
        this.draw()
    }

    draw() {
        canv_ctx.fillStyle = this.color
        canv_ctx.beginPath()
        canv_ctx.arc(this.x, this.y, 7, 0, 2*Math.PI, true)
        canv_ctx.fill()
    }
}


$(function () {

    $('#addBodyField').click(function() {
        add_city_row(cities.length)
        cities.push(new City())
        current_city = cities[cities.length - 1]
    })

    $("#inputspace_canvas").mouseup (function(e) {
        add_city_row(cities.length)
        cities.push(new City())
        current_city = cities[cities.length - 1]
        current_city.make_city(e)
    })

    $('#optimize_btn').click(function() {
        write_data()
    })

    $('#bodyAddForm').on('mousedown', '.city-mouseover', function() {
        // switch_city($(this).attr('data-id'))
        change_active_city($(this))
    })

    $(".row").on('mousedown', '.dropdown-item', function() {
        $(this).parent().siblings().text($(this).text())
        $(this).parent().siblings().val($(this).val())
    })

    $("#opti").on('mousedown', '[name="opti_option"]', function(e) {
        console.log(e.target.value)

        if (e.target.value == "simulated_annealing") {add_annealing_options()}
        else if (e.target.value == "random") {add_random_search_options()}
    })

    $("#play_btn").click(function() {
        
        replay()
    })
})


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_city_row(i) {

    $(".city-mouseover").removeClass('city-selected')

    $("#bodyAddForm").append('<div class="row city-mouseover city-row city-selected mt-1 mb-1 border-secondary rounded-pill" id="city_form-group_'+i+'" data-id='+i+'></div>')


    //label
    $("#city_form-group_"+i).append('<output class="label label-default">city '+i+'</output>')

    add_delete_button(i)
}

function change_active_city(city_row) {
    $(".city-mouseover").removeClass('city-selected')
    city_row.addClass('city-selected')
    switch_city(city_row.attr('data-id'))
}

function add_delete_button(i) {
    //puts delete button to last element

    //removes delete button from all
    $(".remove_city").remove()
    $("#city_form-group_"+i).append('<button class="btn btn-sm btn-outline-danger btn-noborder remove_city ml-3"  type="button">remove</button>')
}

$('#city_definition').on("mousedown",".remove_city", function(e){
    $(this).parent('div').remove();
    cities.splice(-1)
    add_delete_button(cities.length - 1)
    redraw_canvas()
})

function switch_city(i) {
    current_city = cities[i]
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_annealing_options() {
    $("#opti_spec").append('<div id="row_0" class="row"></div>')
    $("#row_0").append('<div id="slider_div" class="col-7 slidecontainer ml-3 mt-3"></div>')
    $("#slider_div").append('<span>Steps: </span>')
    $("#slider_div").append('<input id="num_steps" type="range" class="custom-range w-50 optimization_param" min="10" max="10000" value="1000" oninput="num_steps_label.value = num_steps.value">')
    $("#slider_div").append('<output id="num_steps_label" class="label label-default">1000</output>')

}

function add_random_search_options() {
    $("#opti_spec").append('<div id="row_0" class="row"></div>')
    $("#row_0").append('<div id="slider_div" class="col-7 slidecontainer ml-3 mt-3"></div>')
    $("#slider_div").append('<span>Steps: </span>')
    $("#slider_div").append('<input id="num_steps" type="range" class="custom-range w-50 optimization_param" min="10" max="10000" value="1000" oninput="num_steps_label.value = num_steps.value">')
    $("#slider_div").append('<output id="num_steps_label" class="label label-default">1000</output>')

}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function redraw_canvas() {

    canv_ctx.clearRect(0,0, canv.width, canv.height)
    canv_ctx.globalAlpha = 1.
    for (i=0; i<cities.length; i++) {
        cities[i].draw()
    }
    
}

function draw_solution(solution) {
    for (var i=0; i<(solution.length - 1); i++) {
        canv_ctx.beginPath()
        canv_ctx.moveTo(cities[solution[i]].x,
            cities[solution[i]].y)
        canv_ctx.lineTo(cities[solution[i + 1]].x,
            cities[solution[i + 1]].y)

        canv_ctx.lineWidth = 4
        canv_ctx.strokeStyle = 'GreenYellow'
        canv_ctx.stroke()
    }
}

function replay() {

    for (let i=0; i<replay_data.length; i++) {

        setTimeout(function() {
            redraw_canvas()
            draw_solution(replay_data[i])
        }, i*20)

    }

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function read_optimization_settings() {
    var optimization_settings = {}

    $(".optimization_param").each(function() {
        optimization_settings[$(this).attr('id')] = $(this).val()
    })
    $(".optimization_param_chkbx").each(function() {
        optimization_settings[$(this).attr('id')] = $(this).is(":checked")
    })

    return optimization_settings

}


function write_data() {
    var data_to_write = {}

    data_to_write['optimization_settings'] = read_optimization_settings()

    data_to_write['city_data'] = []

    for (var i=0; i<cities.length; i++) {
        data_to_write['city_data'].push(cities[i])
    }

    var csrftoken = $.cookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    })

    console.log(data_to_write)

    $.ajax(post_url+'/salesman_optimization', {
        type : 'POST',
        contentType : 'application/json',
        data : JSON.stringify(data_to_write),
        dataType: "json",
        success: function (response) {
            console.log(response)
            redraw_canvas()
            draw_solution(response[0])
            replay_data = response[2]
        },
        

    //HIER AUFPASSEN! WAS HIER STEHT WIRD VLT SCHON AUSGEFÜHRT, BEVOR AJAX REQUEST BEENDET IST!!!!
    
    })

}
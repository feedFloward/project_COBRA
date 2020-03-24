var post_url = "http://127.0.0.1:8000"

var mouse_holded
var classes = []
var current_class
var predictions
var accuracy
var precision
var recall
var num_layers = 0
var ml_settings = {}


function add_class(class_obj) {
    classes.push(class_obj)
    do_on_class_change()
}
function remove_class() {
    classes.splice(-1)
    do_on_class_change()
}

function do_on_class_change() {
    if (classes.length > 1) {
        $("#model").removeAttr('disabled')
        $("#train_btn").removeAttr('diabled')
    }

    else {
        $("#model").attr('disabled', 'disabled')
        $("#train_btn").attr('disabled', 'disabled')
    }

    $("#balance_value_label").val(calc_balance_measure())

}


//variance assignment:
const variance_dict = {
    "low" : 1,
    "medium" : 5,
    "high" : 10
}

const color_dict = {
    0 : "red",
    1 : "blue",
    2 : "green",
    3 : "violet",
    4 : "brown",
    5 : "yellow",
    6 : "aqua",
    7 : "orange"
}


var canv = document.getElementById("inputspace_canvas")
var canv_ctx = canv.getContext("2d")

canv.width = document.getElementById("inputspace_div").clientWidth
canv.height = document.getElementById("inputspace_div").clientHeight

class data_class {
    constructor(name) {
        this.name = name
        this.variance = 5
        this.datapoints = []

    }

    make_datapoint(event) {

        var xCoordinate = event.offsetX
        var yCoordinate = event.offsetY
    
        var datapoint_x = tf.randomNormal([1,1], xCoordinate, this.variance)
        var datapoint_y = tf.randomNormal([1,1], yCoordinate, this.variance)
    
        var datapoint = tf.concat([datapoint_x, datapoint_y], 1)
    
        datapoint_x = datapoint_x.dataSync()[0]
        datapoint_y = datapoint_y.dataSync()[0]

        this.datapoints.push([datapoint_x, datapoint_y])
    
        this.draw_point(datapoint_x, datapoint_y)

        if (classes.length > 1) {
            $("#balance_value_label").val(calc_balance_measure())
        }
    }

    draw_point(x, y) {
      
        canv_ctx.fillStyle = color_dict[this.name]
        canv_ctx.beginPath()
        canv_ctx.arc(x, y, 3, 0, 2*Math.PI, true)
        canv_ctx.fill()
    
    }
}


function switch_class(e) {
    current_class = classes[e-1]
}


function read_ml_settings() {

    $(".ml_param").each(function() {
        ml_settings[$(this).attr('id')] = $(this).val()
    })
    $(".ml_param_chkbx").each(function() {
        ml_settings[$(this).attr('id')] = $(this).is(":checked")
    })
    console.log(ml_settings)

}


function write_data() {
    read_ml_settings()
    var data_to_write = {}

    data_to_write['canvas_size'] = [canv.width, canv.height]
    data_to_write['ml_specific'] = ml_settings

    for (var i = 0; i < classes.length; i++) {
        data_to_write[i] = []
        
        for (var j = 0; j < classes[i].datapoints.length; j++) {
            data_to_write[i].push(classes[i].datapoints[j])
        } 
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
    });

    $.ajax(post_url+'/train_classifier', {
        type : 'POST',
        contentType : 'application/json',
        data : JSON.stringify(data_to_write),
        dataType: "json",
        success: function (response) {
            predictions = response['Z']
            accuracy = response['overall_accuracy']
            precision = response['precision']
            recall = response['recall']
            console.log("Trained and predicted!")
            clear_prediction_plot()
            plot_predictions()
            console.log(accuracy)
            console.log(precision)
            console.log(recall)
        },
        

    //HIER AUFPASSEN! WAS HIER STEHT WIRD VLT SCHON AUSGEFÜHRT, BEVOR AJAX REQUEST BEENDET IST!!!!
    
    })

}


function plot_predictions() {
    $("#accuracy_label").val(accuracy.toFixed(3))
    for (var i=0; i<precision.length; i++) {
        $("#precision_label").append('<output class="label ml-3 metric-label">class '+i+': '+precision[i].toFixed(3)+'</output>')
    }
    for (var i=0; i<recall.length; i++) {
        $("#recall_label").append('<output class="label ml-3 metric-label">class '+i+': '+recall[i].toFixed(3)+'</output>')
    }

    for (var x= 0; x < predictions[0].length; x++) {
        for (var y= 0; y < predictions.length; y++) {
            canv_ctx.globalAlpha = 0.4
            canv_ctx.fillStyle = color_dict[predictions[y][x]]
            canv_ctx.fillRect(x,y,1,1)
        }
    }

}


//adding functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_class_row(i) {

    //unselect all other class fields
    $(".class-mouseover").removeClass('class-selected')

    $("#bodyAddForm").append('<div class="row class-mouseover class-selected mt-1 mb-1 border-secondary rounded-pill" id="class_form-group_'+i+'" data-id='+i+'></div>')

    $("#class_form-group_"+i).append('<div class="dropdown mt-1 mb-1 ml-5" id="class_dropdown_'+i+'"></div>')
    $("#class_dropdown_"+i).append('<button class="btn btn-secondary dropdown-toggle" type="button" id="class_dropdownMenuButton'+i+'" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Varianz</button>')
    $("#class_dropdownMenuButton"+i).append('<div class="dropdown-menu" aria-labelledby="dropdownMenuButton" id="class_dd-menu_'+i+'"></div>')
    $("#class_dd-menu_"+i).append('<button type="button" class="btn btn-block btn-dropdown" name="variance_option" value="low" id="classvar_low_'+i+'">low</button>')
    $("#class_dd-menu_"+i).append('<button type="button" class="btn btn-block btn-dropdown" name="variance_option" value="medium" id="classvar_medium_'+i+'">medium</button>')
    $("#class_dd-menu_"+i).append('<button type="button" class="btn btn-block btn-dropdown" name="variance_option" value="high" id="classvar_high_'+i+'">high</button>')

    //label
    $("#class_form-group_"+i).append('<output class="label label-default">class '+i+'</output>')

    add_delete_button(i)
}

function change_active_class() {
    $(".class-mouseover").removeClass('class-selected')
    $(this).addClass('class-selected')
    switch_class($(this).attr('data-id'))
}

function add_delete_button(i) {
    //puts delete button to last element

    //removes delete button from all
    $(".remove_class").remove()
    $("#class_form-group_"+i).append('<button class="btn btn-sm btn-outline-danger btn-noborder remove_class ml-3"  type="button">remove</button>')

}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_layer_row(i) {
    //add new row for each hidden layer
    $("#classi_spec").append('<div id="layer_'+i+'" class="row clf-related"></div>')

    //label
    $("#layer_"+i).append('<output class="label label-default mt-3 ml-2">hidden layer '+i+'</output>')
    
    //add slider-div to row
    $("#layer_"+i).append('<div id="layer_'+i+'_slider" class="col-7 slidecontainer ml-3 mt-3" ></div>')

    //add range-slider to slider-div
    $("#layer_"+i+"_slider").append('<input id="range_'+i+'" type="range" class="custom-range w-50" min="4" max="256" value="16" oninput="layer_units_'+i+'.value = range_'+i+'.value">')
    
    // add range-slider output to slider-div
    $("#layer_"+i+"_slider").append('<output id="layer_units_'+i+'" class="label label-default ml_param">16</output>')
    
    // add activation dropdown to hidden layer row
    $("#layer_"+i).append('<div class="dropup mt-2" ml-auto id="layer_act_dd_'+i+'"></div>')
    
    $("#layer_act_dd_"+i).append('<button class="btn btn-sm btn-primary dropdown-toggle ml_param" type="button" id="layer_activation_'+i+'" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="relu">choose nonlinearity</button>')

    $("#layer_act_dd_"+i).append('<div id="layer_ddmenu_'+i+'" class="dropdown-menu" aria-labelledby="layer_activation_'+i+'"></div>')
    $("#layer_ddmenu_"+i).append('<button class="dropdown-item choose_activation" type="button" id="choose_act_relu" value="relu">relu</button>')
    $("#layer_ddmenu_"+i).append('<button class="dropdown-item choose_activation" type="button" id="choose_act_tanh" value="tanh">tanh</button>')

    add_delete_button_layer(i)
    
}

function add_delete_button_layer(i) {
    //puts delete button to last element

    //removes delete button from all
    $(".remove_layer").remove()
    //remove button
    $("#layer_"+i).append('<button class="btn btn-sm btn-outline-danger btn-noborder remove_layer mt-2 mr-2"  type="button">remove</button>')

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_boosting_options () {
    $("#classi_spec").append('<div class="row clf-related" id="boosting_specs1"></div>')

    $("#boosting_specs1").append('<output class="label label-default ml-3 mt-2">maximum tree depth: </output>')

    $("#boosting_specs1").append('<div id="max_tree_depth_slider" class="col-3 slidecontainer ml-3 mt-2"></div>')
    $("#max_tree_depth_slider").append('<input id="max_tree_depth_range" type="range" class="custom-range w-20" min="1" max="20" value="6" oninput="max_tree_depth.value = max_tree_depth_range.value">')
    $("#boosting_specs1").append('<output id="max_tree_depth" class="label label-default mt-2 ml_param">6</output>')
}

// clear functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function clear_prediction_plot() {
    //clear canvas and redraw remaining class points
    $(".metric-label").remove()
    canv_ctx.clearRect(0,0, canv.width, canv.height)
    canv_ctx.globalAlpha = 1.
    for (i=0; i<classes.length; i++) {
        for (p=0; p < classes[i].datapoints.length; p++) {
            classes[i].draw_point(classes[i].datapoints[p][0], classes[i].datapoints[p][1])
        }
    }
    
}

function clear_classifier() {
    //erase classifier choice and configuration
    ml_settings = {}
    num_layers = 0
    $(".clf-related").remove()
}


//statistical helpers
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function calc_balance_measure() {
    //shannon entropy

    var n = 0
    for (var i=0; i<classes.length; i++) {
        n += classes[i].datapoints.length
    }

    H = 0
    for (var i=0; i<classes.length; i++) {
        H -= (classes[i].datapoints.length / n) * Math.log2(classes[i].datapoints.length / n)
    }

    H = H / Math.log2(classes.length)

    if (Number.isNaN(H)) {
        return 'not defined'
    }
    else {
        return H.toFixed(4)
    }
}

function set_exponential_value(power) {
    return Math.pow(10, power).toFixed(Math.abs(power))
}
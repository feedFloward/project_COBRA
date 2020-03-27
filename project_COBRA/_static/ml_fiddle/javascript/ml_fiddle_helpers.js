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
var clf_history = []


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
    "medium" : 7,
    "high" : 14
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
            save_results_and_settings(classes)
            clear_prediction_plot()
            plot_predictions(predictions)
        },
        

    //HIER AUFPASSEN! WAS HIER STEHT WIRD VLT SCHON AUSGEFÜHRT, BEVOR AJAX REQUEST BEENDET IST!!!!
    
    })

}


function plot_predictions(cnv_prediction) {
    $("#accuracy_label").val(accuracy.toFixed(3))
    for (var i=0; i<precision.length; i++) {
        $("#precision_label").append('<output class="label ml-3 metric-label">class '+i+': '+precision[i].toFixed(3)+'</output>')
    }
    for (var i=0; i<recall.length; i++) {
        $("#recall_label").append('<output class="label ml-3 metric-label">class '+i+': '+recall[i].toFixed(3)+'</output>')
    }

    for (var x= 0; x < cnv_prediction[0].length; x++) {
        for (var y= 0; y < cnv_prediction.length; y++) {
            canv_ctx.globalAlpha = 0.4
            canv_ctx.fillStyle = color_dict[cnv_prediction[y][x]]
            canv_ctx.fillRect(x,y,1,1)
        }
    }

}


//save and store results of a training run
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function save_results_and_settings(current_classes) {
    var current_state = {}

    var tmp_classes = []

    Object.assign(tmp_classes, current_classes)

    current_state['classes'] = tmp_classes

    current_state['ml_settings'] = ml_settings

    current_state['predictions'] = predictions

    current_state['accuracy'] = accuracy

    current_state['precision'] = precision

    current_state['recall'] = recall

    clf_history.push(current_state)

    console.log(current_state)
    console.log(clf_history)

    var curr_state_name = current_state["ml_settings"]["model"] + ' acc: ' + current_state['accuracy'].toFixed(3)

    $("#clf_history_dropdown").append('<button type="button" class="btn btn-block btn-dropdown"  value="'+(clf_history.length-1)+'" name="history_choice" id="bygone_clf_'+ clf_history.length +'">'+ curr_state_name +'</button>')
}

function restore_status(history_entry) {

    classes = []
    Object.assign(classes, clf_history[history_entry]['classes'])

    accuracy = clf_history[history_entry]['accuracy']

    precision = clf_history[history_entry]['precision']

    recall = clf_history[history_entry]['recall']

    clear_prediction_plot()
    plot_predictions(clf_history[history_entry]['predictions'])

    // reset class column
    $('.class-row').remove()
    for (var i=1; i<= classes.length; i++) {
        add_class_row(i)
    }


    clear_classifier()

    if (clf_history[history_entry]['ml_settings']['model'] == 'svm') {add_svm_options(clf_history[history_entry]['ml_settings']['kernel'])}

    else if (clf_history[history_entry]['ml_settings']['model'] == 'nn') {
        add_nn_options(clf_history[history_entry]['ml_settings']['optimizer'],
                        clf_history[history_entry]['ml_settings']['batch_norm'],
                        clf_history[history_entry]['ml_settings']['lr'],
                        clf_history[history_entry]['ml_settings']['dropout'],)

        let layer_units = []
        let layer_activation = []
        for (let [key, value] of Object.entries(clf_history[history_entry]['ml_settings'])) {
            if (key.startsWith('layer_units')) {
                layer_units.push(value)
            }
            if (key.startsWith('layer_activation')) {
                layer_activation.push(value)
            }
        }

        for (var layer=1; layer <= layer_units.length; layer++) {
            add_layer_row(layer, layer_units[layer-1], layer_activation[layer-1])
        }

    }

    else if (clf_history[history_entry]['ml_settings']['model'] == 'boosting') {add_boosting_options(clf_history[history_entry]['ml_settings']['max_tree_depth'])}

    for (let [key, value] of Object.entries(clf_history[history_entry]['ml_settings'])) {
        $('#'+key).val(value)
        $('#'+key).text(value)

        if ($('#'+key).hasClass('custom-range')) {
            $('#'+key).siblings('.label').val(value)
            $('#'+key).siblings('.label').text(value)
        }
    }
}


//adding functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function add_class_row(i) {

    //unselect all other class fields
    $(".class-mouseover").removeClass('class-selected')

    $("#bodyAddForm").append('<div class="row class-mouseover class-row class-selected mt-1 mb-1 border-secondary rounded-pill" id="class_form-group_'+i+'" data-id='+i+'></div>')

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

function add_layer_row(i, units, activation) {
    //add new row for each hidden layer
    $("#classi_spec").append('<div id="layer_'+i+'" class="row clf-related"></div>')

    //label
    $("#layer_"+i).append('<output class="label label-default mt-3 ml-2">hidden layer '+i+'</output>')
    
    //add slider-div to row
    $("#layer_"+i).append('<div id="layer_'+i+'_slider" class="col-7 slidecontainer ml-3 mt-3" ></div>')

    //add range-slider to slider-div
    $("#layer_"+i+"_slider").append('<input id="layer_units_'+i+'" type="range" class="custom-range w-50 ml_param" min="4" max="256" value="'+units+'" oninput="layer_units_'+i+'_label.value = layer_units_'+i+'.value">')
    
    // add range-slider output to slider-div
    $("#layer_"+i+"_slider").append('<output id="layer_units_'+i+'_label" class="label label-default">16</output>')
    
    // add activation dropdown to hidden layer row
    $("#layer_"+i).append('<div class="dropup mt-2" ml-auto id="layer_act_dd_'+i+'"></div>')
    
    $("#layer_act_dd_"+i).append('<button class="btn btn-sm btn-primary dropdown-toggle ml_param" type="button" id="layer_activation_'+i+'" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="'+activation+'">choose nonlinearity</button>')

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

function add_svm_options (kernel_type) {
    $("#classi_spec").append('<div id="kernel_type_row" class="row ml-2 mt-1 clf-related"></div>')
    $("#kernel_type_row").append(`
        <div class="dropdown">
            <button class="btn btn-primary dropdown-toggle clf-related ml_param" type="button" id="kernel" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="`+kernel_type+`">
                choose kernel
            </button>
            <div class="dropdown-menu" aria-labeledby="kernel">
                <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="rbf">rbf</button>
                <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="linear">linear</button>
                <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="poly">polynomial</button>
                <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="sigmoid">sigmoid</button>
            </div>
        </div>`)
}

function add_nn_options (optimizer, batch_norm, learning_rate, dropout) {
    $("#classi").append('<button type="button" class="btn btn-info mt-1 clf-related" id="add_layer">add layer</button>')
    $("#classi_spec_opti").append('<div id="optimization_row" class="row ml-2"></div>')
    $("#optimization_row").append(`
        <div class="dropdown">
            <button class="btn btn-primary dropdown-toggle clf-related ml_param" type="button" id="optimizer" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="`+optimizer+`">
                choose optimizer
            </button>
            <div class="dropdown-menu" aria-labelledby="model">
                <button class="btn-dropdown dropdown-item" type="button" name="opti_option" id="choose_sgd" value="sgd">SGD</button>
                <button class="btn-dropdown dropdown-item" type="button" name="opti_option" id="choose_rmsprop" value="rmsprop">RMSprop</button>
                <button class="btn-dropdown dropdown-item" type="button" name="opti_option" id="choose_adam" value="adam">Adam</button>
            </div>
        </div>`)

    //optimizer options
    $("#classi_spec_opti").append('<div id="batch_norm_row" class="row ml-2 mt-1 clf-related"></div>')
    if (batch_norm == true) {$("#batch_norm_row").append('<input id="batch_norm" class="ml-2 mt-1 ml_param_chkbx" type="checkbox" checked>')}
    else {$("#batch_norm_row").append('<input id="batch_norm" class="ml-2 mt-1 ml_param_chkbx" type="checkbox">')}
    $("#batch_norm_row").append('<label class="form-check-label" for="batch_norm">batch norm</label>')
    $("#classi_spec_opti").append('<div id="learning_rate_row" class="row ml-2 mt-1 clf-related"></div>')
    $("#learning_rate_row").append('<span>learning rate: </span>')
    $("#learning_rate_row").append('<input id="lr" type="range" class="custom-range w-20 ml_param" min="-6" max="1" step="1" value="'+learning_rate+'" oninput="lr_label.value = set_exponential_value(lr.value)">')
    $("#learning_rate_row").append('<output id="lr_label" class="label label-default">0.001</output>')



    // Regularization part
    $("#classi_spec_opti").append('<div id="regularization_row" class="row ml-2 mt-1 clf-related"></div>')
    $("#regularization_row").append('<span class="font-weight-bold">regularization</span>')
    $("#classi_spec_opti").append('<div id="dropout_row" class="row ml-2 mt-1 clf-related"></div>')
    $("#dropout_row").append('<span>dropout: </span>')
    $("#dropout_row").append('<input id="dropout" type="range" class="custom-range w-20 ml_param" min="0" max="0.99" step="0.01" value="'+dropout+'" oninput="dropout_label.value = dropout.value">')
    $("#dropout_row").append('<output id="dropout_label" class="label label-default">0</output>')

}

function add_boosting_options (max_tree_depth) {
    $("#classi_spec").append('<div class="row clf-related" id="boosting_specs1"></div>')

    $("#boosting_specs1").append('<output class="label label-default ml-3 mt-2">maximum tree depth: </output>')

    $("#boosting_specs1").append('<div id="max_tree_depth_slider" class="col-3 slidecontainer ml-3 mt-2"></div>')
    $("#max_tree_depth_slider").append('<input id="max_tree_depth" type="range" class="custom-range w-20 ml_param" min="1" max="20" value="'+max_tree_depth+'" oninput="max_tree_depth_label.value = max_tree_depth.value">')
    $("#max_tree_depth_slider").append('<output id="max_tree_depth_label" class="label label-default mt-2">6</output>')
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
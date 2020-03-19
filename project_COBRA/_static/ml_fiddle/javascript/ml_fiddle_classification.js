$(function() {

    $('#clear_all_btn').click(function() {
        clear_prediction_plot()
    })

    $('#bodyAddForm').on('mousedown', '[name="variance_option"]', function (e) {
        var belonging_class = e.target.id.slice(-1)-1
        var variance_val = e.target.value
        variance_val = variance_dict[variance_val]
        classes[belonging_class].variance = variance_val
    });

    $('#bodyAddForm').on('mousedown', '[name="class_choice"]', function (e) {
        switch_class(e.target.value)
    });


    $("#inputspace_canvas").mousemove (function(event) {
        if (mouse_holded == true && classes.length > 0) {
            a = setInterval(current_class.make_datapoint(event), 300)
        }
    })

    $("#inputspace_canvas").mousedown (function(event) {
        mouse_holded = true
        if (classes.length > 0) a = setInterval(current_class.make_datapoint(event), 300)
    })

    $("#inputspace_canvas").mouseup (function() {
        mouse_holded = false
    })



    $("#classi").on('mousedown', '[name="classi_option"]', function(e) {
        clear_classifier()
        $("#train_btn").removeAttr('disabled')
        $("#model").text($(this).text())
        $("#model").val($(this).val())
    })

    $("#choose_nn").click(function(e) {

        $("#classi").append('<button type="button" class="btn btn-info mt-1 clf-related" id="add_layer">add layer</button>')
        $("#classi_spec_opti").append('<div id="optimization_row" class="row ml-2"></div>')
        $("#optimization_row").append(`
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle clf-related ml_param" type="button" id="optimizer" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="sgd">
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
        $("#batch_norm_row").append('<input id="batch_norm" class="ml-2 mt-1 ml_param_chkbx" type="checkbox">')
        $("#batch_norm_row").append('<label class="form-check-label" for="batch_norm">batch norm</label>')
        $("#classi_spec_opti").append('<div id="learning_rate_row" class="row ml-2 mt-1 clf-related"></div>')
        $("#learning_rate_row").append('<span>learning rate: </span>')
        $("#learning_rate_row").append('<input id="lr_range" type="range" class="custom-range w-20" min="-6" max="1" step="1" value="-3" oninput="lr.value = set_exponential_value(lr_range.value)">')
        $("#learning_rate_row").append('<output id="lr" class="label label-default ml_param">0.001</output>')



        // Regularization part
        $("#classi_spec_opti").append('<div id="regularization_row" class="row ml-2 mt-1 clf-related"></div>')
        $("#regularization_row").append('<span class="font-weight-bold">regularization</span>')
        $("#classi_spec_opti").append('<div id="dropout_row" class="row ml-2 mt-1 clf-related"></div>')
        $("#dropout_row").append('<span>dropout: </span>')
        $("#dropout_row").append('<input id="dropout_range" type="range" class="custom-range w-20" min="0" max="0.99" step="0.01" value="0" oninput="dropout.value = dropout_range.value">')
        $("#dropout_row").append('<output id="dropout" class="label label-default ml_param">0</output>')

    })

    $("#choose_svm").click(function() {
        $("#classi_spec").append('<div id="kernel_type_row" class="row ml-2 mt-1 clf-related"></div>')
        $("#kernel_type_row").append(`
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle clf-related ml_param" type="button" id="kernel" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" value="rbf">
                    choose kernel
                </button>
                <div class="dropdown-menu" aria-labeledby="kernel">
                    <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="rbf">rbf</button>
                    <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="linear">linear</button>
                    <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="poly">polynomial</button>
                    <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="sigmoid">sigmoid</button>
                    <button class="btn-dropdown dropdown-item" type="button" name="kernel_option" value="precomputed">precomputed</button>
                </div>
            </div>`)
    })

    $("#choose_boosting").click(function() {
        add_boosting_options()
    })

    $("#classi_spec_opti").on('mousedown', '[name="opti_option"]', function(e) {
        $("#optimizer").text($(this).text())
        $("#optimizer").val($(this).val())

    })

    $(".container-fluid").on('mousedown', '.dropdown-item', function(e) {
        console.log("hihihihi")
    })

    $("#train_btn").click(write_data)


    $('#addBodyField').click(function(e){

        if (classes.length > 6) {
            return
        }
        add_class(new data_class(classes.length))
        add_class_row(classes.length)

        switch_class(classes.length)

    });

    $("#class_definition").on("mousedown", ".class-mouseover", change_active_class)


    $("#classi").on('mousedown', "#add_layer", function(e) {
        if (num_layers > 3) {
            return
        }

        num_layers += 1

        add_layer_row(num_layers)

    })


    $("#classi_spec").on('mousedown', '.choose_activation', function(e) {

        var layer = $(this).parent().attr("id").slice(-1)
        $("#layer_activation_"+layer).text($(this).text())
        $("#layer_activation_"+layer).val($(this).text())
    })

    $('#classi_spec').on("mousedown",".remove_layer", function(e){
        $(this).parent('div').remove();
        num_layers -= 1
        add_delete_button_layer(num_layers)
    })
    $('#class_definition').on("mousedown",".remove_class", function(e){
        $(this).parent('div').remove();
        remove_class()
        add_delete_button(classes.length)
        clear_prediction_plot()
    })
})
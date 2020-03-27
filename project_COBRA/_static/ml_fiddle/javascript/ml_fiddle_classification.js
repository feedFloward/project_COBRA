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
        console.log(e.target.value)
        clear_classifier()

        if (e.target.value == "svm") {add_svm_options('rbf')}

        else if (e.target.value == "nn") {add_nn_options('sgd', false, -3, 0)}

        else if (e.target.value == "boosting") {add_boosting_options(6)}

        $("#train_btn").removeAttr('disabled')
    })


    $(".container-fluid").on('mousedown', '.dropdown-item', function(e) {
        $(this).parent().siblings().text($(this).text())
        $(this).parent().siblings().val($(this).val())
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

        add_layer_row(num_layers, 16, 'relu')

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


    $('#clf_history_dropdown').on("mousedown", '[name="history_choice"]', function() {
        restore_status($(this).val())
    })



})


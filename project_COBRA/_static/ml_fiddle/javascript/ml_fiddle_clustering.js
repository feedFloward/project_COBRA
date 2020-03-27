var draw_mode_on = false

$(function () {

    $('#clear_all_btn').click(function() {
        clear_prediction_plot()
    })

    $('#draw_on_button').click(function() {
        draw_mode_on = !draw_mode_on

        if (draw_mode_on && classes.length < 1) {
            classes.push(new data_class(classes.length))
        }
        current_class = classes[0]
        console.log(classes)
    })  

    $('#class_dropdown').on('mousedown', '[name="variance_option"]', function (e) {
        var variance_val = e.target.value
        variance_val = variance_dict[variance_val]
        classes[0].variance = variance_val
    }); 

    $("#inputspace_canvas").mousemove (function(event) {
        if (mouse_holded == true && draw_mode_on == true) {
            a = setInterval(current_class.make_datapoint(event), 300)
        }
    })

    $("#inputspace_canvas").mousedown (function(event) {
        mouse_holded = true
        if (draw_mode_on == true) a = setInterval(current_class.make_datapoint(event), 300)
    })

    $("#inputspace_canvas").mouseup (function() {
        mouse_holded = false
    })

    $("#clustering_choice").on('mousedown', '[name="cluster_option"]', function() {
        clear_clustering()
        $("#clustering_type").text($(this).text())
        $("#clustering_type").val($(this).val())
    })

    $("#train_btn").click(function() {
        clear_prediction_plot()
        $(".ml_param").each(function() {
            ml_settings[$(this).attr('id')] = $(this).val()
        })

        var data_to_write = {}

        data_to_write['canvas_size'] = [canv.width, canv.height]
        data_to_write['ml_specific'] = ml_settings
    
        for (var i = 0; i < classes.length; i++) {
            data_to_write[i] = []
            
            for (var j = 0; j < classes[i].datapoints.length; j++) {
                data_to_write[i].push(classes[i].datapoints[j])
            } 
        }

        console.log(data_to_write)
    
        
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

        $.ajax(post_url+'/train_clustering', {
            type : 'POST',
            contentType : 'application/json',
            data : JSON.stringify(data_to_write),
            dataType: "json",
            success: function (response) {
                console.log("Trained and predicted!")
                console.log(response)

                var predictions = response['Z']
                for (var x= 0; x < predictions[0].length; x++) {
                    for (var y= 0; y < predictions.length; y++) {
                        canv_ctx.globalAlpha = 0.4
                        canv_ctx.fillStyle = color_dict[predictions[y][x]]
                        canv_ctx.fillRect(x,y,1,1)
                    }
                }
            },
            
    
        //HIER AUFPASSEN! WAS HIER STEHT WIRD VLT SCHON AUSGEFÜHRT, BEVOR AJAX REQUEST BEENDET IST!!!!
        
        })
    

    })

    $("#choose_k-means").click(function() {
        $("#cluster_spec").append('<div id="cluster_spec_row1" class="row cluster-related"></div>')
        //label
        $("#cluster_spec_row1").append('<output class="label label-default mt-3 ml-2">number of cluster: </output>')
        //slider-div
        $("#cluster_spec_row1").append('<div id="num_cluster_slider" class="col-7 slidecontainer ml-3 mt-3" ></div>')
        //range-slider to slider-div
        $("#num_cluster_slider").append('<input id="range_num_cluster" type="range" class="custom-range w-50" min="2" max="20" value="2" oninput="num_cluster_val.value = range_num_cluster.value">')
        // range-slider output to slider-div
        $("#num_cluster_slider").append('<output id="num_cluster_val" class="label label-default ml_param">2</output>')

    })


    
})

function clear_clustering() {
    //erase clustering choice and configuration
    ml_settings = {}
    $(".cluster-related").remove()
}

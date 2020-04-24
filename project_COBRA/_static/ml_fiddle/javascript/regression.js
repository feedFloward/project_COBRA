var post_url = "http://127.0.0.1:8000"

let LayerComponent = {
    delimiters: ['[[', ']]'],
    template: "#layer-template",
    // props: {
    //     numberUnits: Number,
    //     activation: String,
    // },
    props: {
        id: Number
    },
    
    mounted() {
        this.idx = this.id
    },

    data() {
        return {
            idx: null,
            numberUnits : 16,
            activation : 'relu',
            activations: ['relu', 'sigmoid', 'tanh']
        }    
    },
    
    watch: {
        $data: {
            handler: function() {
                this.$emit('set-layer-options', {'idx': this.idx, 'numberUnits':this.numberUnits, 'activation': this.activation})
            },
            deep:true
        }
    }
}

Vue.component('neural-net-options', {
    delimiters: ['[[', ']]'],
    template: "#neural-net-template",
    components: {
        'layer-component': LayerComponent
    },
    mounted() {
        this.$emit('set-ml-options', this.$data)
    },

    data() {
        return {
            layers: []
        }
    },

    methods: {

        get_layer_options(e) {
            this.layers[e.idx] = e
        }
    },
    watch: {
        $data: {
            handler: function() {
                this.$emit('set-ml-options', this.$data)
            },
            deep: true
        }
    }
})

Vue.component('linear-regression-options', {
    delimiters: ['[[', ']]'],
    template: "#linear-regression-template",
    mounted() {
        this.$emit('set-ml-options', this.$data)
    },

    data() {
        return {
            polynomial_order: 1,
        }
    },
    watch: {
        $data: {
            handler: function() {
                this.$emit('set-ml-options', this.$data)
            },
            deep: true
        }
    }
})


var regressionApp = new Vue({
    delimiters: ['[[', ']]'],
    el: "#regression-app",

    methods: {
        mousedown(){
            this.draw_mode = true

        },

        mouseup() {
            this.draw_mode = false
        },

        mousemove(e) {
            if (this.draw_mode == true) {
                this.brush_points(e)
            }
        },

        brush_points(e) {

            var datapoint_x = tf.randomNormal([1,1], e.offsetX, this.currVariance)
            var datapoint_y = tf.randomNormal([1,1], e.offsetY, this.currVariance)
        
            
            datapoint_x = datapoint_x.dataSync()[0]
            datapoint_y = datapoint_y.dataSync()[0]

            this.points.push({
                x: datapoint_x,
                y: datapoint_y,
            })

            this.draw_single_point(datapoint_x, datapoint_y)
        },

        clear_data() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.points = []
        },

        draw_single_point(x, y, size=3, color="Lime") {
            this.context.fillStyle = color
            this.context.beginPath()
            this.context.arc(x, y, size, 0, 2*Math.PI, true)
            this.context.fill()
        },

        plot_data(dataToPlot, size=3, color="Lime") {
            for (var i=0; i < dataToPlot.length; i++) {
                this.draw_single_point(dataToPlot[i][0], dataToPlot[i][1], size, color)
            }
        },

        redraw_data() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            for (var i=0; i < this.points.length; i++) {
                this.draw_single_point(this.points[i]['x'], this.points[i]['y'])
            }
        },

        get_ml_specs(e) {
            this.mlSpecs = e
        },

        async write_data() {
            axios.defaults.xsrfCookieName = 'csrftoken';
            axios.defaults.xsrfHeaderName = 'X-CSRFToken';
            let response = await axios.post(post_url+'/train_regression', JSON.stringify(
                {
                    'data': this.points,
                    'model': this.currModel,
                    'inputspace': [this.canvas.width, this.canvas.height],
                    'ml_specs': this.mlSpecs
                }
            ))
            this.predictions = response.data
            this.redraw_data()
            this.plot_data(this.predictions, 1, "Black")
        }

    },

    data: function() {
        return {
            draw_mode: false,
            canvas: null,
            context: null,
            currVariance: 7,
            variances: [
                {name: 'none', val: 0},
                {name: 'low', val: 3},
                {name: 'medium', val: 7},
                {name: 'high', val: 15},
            ],
            currModel: {},
            models: [
                {name: 'linear regression', val: 'linear_regression'},
                {name: 'neural net', val: 'nn'},
            ],
            mlSpecs: [],
            points: [],
            predictions: {},
        }
    },

    mounted() {
        this.canvas = this.$refs.inputspace_canvas
        this.context = this.canvas.getContext("2d")
        this.canvas.width = $("#inputspace_div").width()
        this.canvas.height = $("#inputspace_div").height()
        this.canvas.addEventListener('mousedown', this.mousedown)
        this.canvas.addEventListener('mouseup', this.mouseup)
        this.canvas.addEventListener('mousemove', this.mousemove)
    },


})
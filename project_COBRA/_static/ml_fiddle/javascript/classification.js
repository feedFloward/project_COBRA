var post_url = "http://127.0.0.1:8000"

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
    
    methods: {
        remove_layer(layer_index) {
            this.$parent.remove_layer(layer_index)
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
            layers: [],
            batchNorm: false
        }
    },

    methods: {

        get_layer_options(e) {
            this.layers[e.idx] = e
        },

        remove_layer(layer_index) {
            this.layers.splice(layer_index, 1)
        },
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

Vue.component('svm-options', {
    delimiters: ['[[', ']]'],
    template: "#svm-options-template",
    
    mounted () {
        //default values
        this.$emit('set-ml-options', {'kernel': 'rbf'});
    },

    data() {
        return {
            kernels: [
                'rbf',
                'linear',
                'sigmoid',
                'polynomial',
            ],
            currKernel: ''
        }
    },
    watch: {
        $data: {
            handler: function() {
                this.$emit('set-ml-options', {'kernel': this.currKernel})
            },
            deep: true
        }
    },
})

Vue.component('class-definition', {
    delimiters: ['[[', ']]'],
    template: '#class-definition-template',
    props: {
        index: {
            type: Number,
        },
        numSamples: {
            type: Number
        }
    },
    data() {
        return {

        }
    },

    methods: {
        remove_class(class_index) {
            this.$parent.remove_class(class_index)
        },

        select_class(class_index) {
            this.$parent.select_class(class_index)
        }
    },

})


var classificationApp = new Vue({
    delimiters: ['[[', ']]'],
    el: "#classification-app",

    created () {
        this.enableInterceptor();
    },

    methods: {
        enableInterceptor() {
            this.axiosInterceptor = window.axios.interceptors.request.use((config) => {
                this.isLoading = true
                return config
            }, (error) => {
                this.isLoading = false
                return Promise.reject(error)
            })

            window.axios.interceptors.response.use((response) => {
                this.isLoading = false
                return response
            }, function(error) {
                this.isLoading = false
                return Promise.reject(error)
            })
        },

        remove_class(class_index) {
            this.dataset.splice(class_index, 1)
            this.redraw_data()
        },

        add_class() {

            // Vue.set(this.dataset, Object.keys(this.dataset).length, [])
            this.dataset.push([])
            this.currClass = Object.keys(this.dataset).length - 1
        },

        select_class(class_index) {
            this.currClass = class_index
        },

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

            this.dataset[this.currClass].push({
                x: datapoint_x,
                y: datapoint_y,
            })

            this.draw_single_point(datapoint_x, datapoint_y, 3, color_dict[this.currClass])
        },

        clear_data() {
            this.context.globalAlpha = 1
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            this.dataset = []
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

        plot_predictions() {
            for (var x= 0; x < this.predictions['Z'][0].length; x++) {
                for (var y= 0; y < this.predictions['Z'].length; y++) {
                    this.context.globalAlpha = 0.4
                    this.context.fillStyle = color_dict[this.predictions['Z'][y][x]]
                    this.context.fillRect(x,y,1,1)
                }
            }
        },

        redraw_data() {
            this.context.globalAlpha = 1
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            for (var i=0; i < this.dataset.length; i++) {
                for (var j=0; j < this.dataset[i].length; j++) {       
                    this.draw_single_point(this.dataset[i][j]['x'], this.dataset[i][j]['y'], 3, color_dict[i])
                }
            }
        },

        get_ml_specs(e) {
            this.mlSpecs = e
        },

        async write_data() {
            axios.defaults.xsrfCookieName = 'csrftoken';
            axios.defaults.xsrfHeaderName = 'X-CSRFToken';
            let response = await axios.post(post_url+'/train_classifier', JSON.stringify(
                {
                    'data': this.dataset,
                    'model': this.currModel,
                    'inputspace': [this.canvas.width, this.canvas.height],
                    'ml_specs': this.mlSpecs
                }
            ))
            this.predictions = response.data
            this.redraw_data()
            this.plot_predictions()
        }

    },

    data: function() {
        return {
            isLoading: false,
            axiosInterceptor: null,
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
                {name: 'neural net', val: 'nn'},
                {name: 'logistic regression', val: 'logistic'},
                {name: 'svm', val: 'svm'},
                {name: 'tree', val: 'tree'},
                {name: 'k-nn', val: 'k-nn'},
                {name: 'random forest', val: 'forest'},
                {name: 'boosted dt', val: 'boosting'},
                {name: 'naive bayes', val: 'naive_bayes'},
            ],
            mlSpecs: [],
            currClass: null,
            dataset: [],
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

    computed: {
        getTotalSampleSize() {
            sum = 0
            for (let i=0; i < this.dataset.length; i++) {
                sum += this.dataset[i].length
            }
            return sum
        },

        calc_balance_measure() {
            //shannon entropy
            if (this.dataset.length < 2) {
                return 'not defined'
            }

            var n = 0
            for (var i=0; i<this.dataset.length; i++) {
                n += this.dataset[i].length
            }

            H = 0
            for (var i=0; i<this.dataset.length; i++) {
                H -= (this.dataset[i].length / n) * Math.log2(this.dataset[i].length / n)
            }

            H = H / Math.log2(this.dataset.length)

            if (Number.isNaN(H)) {
                return 'not defined'
            }
            else {
                return H.toFixed(3)
            }
        }
    },

})
var post_url = "http://127.0.0.1:8000"

Vue.component('cem-options', {
    delimiters: ['[[', ']]'],
    template: "#cem-template",

    mounted () {
        //default values
        this.$emit('set-optimizer-options', {'numSteps': 100, 'N': 10});
    },

    data() {
        return {
            numSteps: 100,
            Nval: 10
        }
    },

    watch: {
        $data: {
            handler: function() {
                this.$emit('set-optimizer-options', {'numSteps': this.numSteps, 'N': this.Nval})
            },
            deep: true
        }
    },
})

Vue.component('simulated-annealing-options', {
    delimiters: ['[[', ']]'],
    template: "#simulated-annealing-template",

    mounted () {
        //default values
        this.$emit('set-optimizer-options', {'numSteps': 1000, 'initialTemperature': 10});
    },

    data() {
        return {
            numSteps: 1000,
            initialTemperature: 10
        }
    },

    watch: {
        $data: {
            handler: function() {
                this.$emit('set-optimizer-options', {'numSteps': this.numSteps, 'initialTemperature': this.initialTemperature})
            },
            deep: true
        }
    },
})

Vue.component('random-options', {
    delimiters: ['[[', ']]'],
    template: "#random-template",

    mounted () {
        //default values
        this.$emit('set-optimizer-options', {'numSteps': 1000});
    },

    data() {
        return {
            numSteps: 1000
        }
    },

    watch: {
        $data: {
            handler: function() {
                this.$emit('set-optimizer-options', {'numSteps': this.numSteps})
            },
            deep: true
        }
    },
})

Vue.component('city-definition', {
    delimiters: ['[[', ']]'],
    template: '#city-definition-template',

    props: {
        index: {
            type: Number,
        }
    },

    data() {
        return {
        }
    },

    methods: {
        removeCity(city_index) {
            this.$parent.removeCity(city_index)            
        }
    },

    computed: {
        isStartCity() {
            if (this.index == 0) {
                return true
            }
            else {
                return false
            }
        }
    },

})

var tsmApp = new Vue({
    delimiters: ['[[', ']]'],
    el: '#tsm-app',

    methods: {
        makeCity(e) {
            xCoord = e.offsetX
            yCoord = e.offsetY

            city = {
                x: xCoord,
                y: yCoord,
            }
            //append to list
            this.cities.push(city)
            this.drawCity(city)
        },

        drawCity(city, color="blue") {
            this.context.fillStyle = color
            this.context.beginPath()
            this.context.arc(city["x"], city["y"], 7, 0, 2*Math.PI, true)
            this.context.fill()
        },

        removeCity(city_index) {
            this.cities.splice(city_index, 1)
            this.redrawCanvas()
        },

        resetData() {
            this.cities = []
            this.redrawCanvas()
        },

        redrawCanvas() {
            this.context.globalAlpha = 1
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            for (i=0; i < this.cities.length; i++) {
                this.drawCity(this.cities[i])
            }
        },

        getOptimizerSpecs(e) {
            this.optimizationSpecs = e
        },

        async writeData() {
            axios.defaults.xsrfCookieName = 'csrftoken';
            axios.defaults.xsrfHeaderName = 'X-CSRFToken';
            let response = await axios.post(post_url+'/salesman_optimization', JSON.stringify(
                {
                    'city_data': this.cities,
                    'optimization': this.currOptimization,
                }
            ))
            this.predictions = response.data
        }
    },

    data() {
        return {
            canvas: null,
            context: null,
            cities: [],

            currOptimization: {},
            optimizations: [
                {name: 'random hill climb', val: 'random'},
                {name: 'simulated annealing', val: 'simulated_annealing'},
                {name: 'cross entropy method', val: 'cem'}
            ],
            optimizationSpecs: []
        }
    },

    mounted() {
        this.canvas = this.$refs.inputspace_canvas
        this.context = this.canvas.getContext("2d")
        this.canvas.width = $("#inputspace_div").width()
        this.canvas.height = $("#inputspace_div").height()
        this.canvas.addEventListener('mousedown', this.makeCity)
    },
})
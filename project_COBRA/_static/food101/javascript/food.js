var post_url = "http://127.0.0.1:8000"


var foodApp = new Vue({
    delimiters: ['[[', ']]'],
    el: '#food-app',

    created () {
        this.enableInterceptor();
    },

    methods: {
        async make_prediction() {
            axios.defaults.xsrfCookieName = 'csrftoken';
            axios.defaults.xsrfHeaderName = 'X-CSRFToken';
            let response = await axios.post(post_url+'/predict_food')
            console.log(response.data)
            this.foodName = response.data['prediction']
            this.description = this.descrption_words[Math.floor(Math.random() * this.descrption_words.length)]
        },

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

    },

    data() {
        return {
            isLoading: false,
            axiosInterceptor: null,
            foodName: null,
            description: null,

            descrption_words: [
                'yummi',
                'delicious',
                'mouth-watering',
                'yum-yum',
            ],
        }
    },
})
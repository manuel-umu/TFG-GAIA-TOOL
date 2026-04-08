import Vue from 'vue';
import App from './App.vue';
import router from './router/index.js'; 
import './assets/styles/styles.scss';
import Buefy from 'buefy';
import '@mdi/font/css/materialdesignicons.min.css';


Vue.use(Buefy); // Usa Buefy

new Vue({
    render: h => h(App),
    router // Usa el enrutador
}).$mount('#app');
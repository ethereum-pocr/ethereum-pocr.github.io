import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import '@mdi/js'

import store from "./store/index"
import router from './router'
import { setupAuthNavigationGuard } from '@/lib/auth'

Vue.config.productionTip = false

setupAuthNavigationGuard(router, store);

new Vue({
  vuetify,
  store,
  router,
  render: h => h(App)
}).$mount('#app');
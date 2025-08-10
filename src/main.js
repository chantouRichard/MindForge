import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const vuetify = createVuetify({
  components,
  directives,
})

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.use(vuetify)
app.mount('#app')

console.warn = () => {};

// window.addEventListener('blur', () => {
//   document.title = "";
// });

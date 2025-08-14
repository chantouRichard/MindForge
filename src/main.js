import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import VueKonva from 'vue-konva';

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.use(VueKonva)
app.mount('#app')

console.warn = () => {};
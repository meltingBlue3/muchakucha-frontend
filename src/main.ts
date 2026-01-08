import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Naive UI 通用字体和样式
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')


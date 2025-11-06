import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import "./assets/index.css"
import "@fortawesome/fontawesome-free/css/all.css"

const pinia = createPinia()

createApp(App).use(router).use(pinia).mount("#app")

import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./frontend/App.vue"
import router from "./frontend/router"
import "./frontend/assets/index.css"
import "@fortawesome/fontawesome-free/css/all.css"

const pinia = createPinia()

createApp(App).use(router).use(pinia).mount("#app")

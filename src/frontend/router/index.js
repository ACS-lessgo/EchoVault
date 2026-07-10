import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router"
import Home from "../components/HomePage.vue"
import AllSongs from "../components/AllSongs.vue"
import Artists from "../components/Artists.vue"
import Library from "../components/Library.vue"
import MediaManagement from "../components/MediaManagement.vue"
import Playlists from "../components/Playlists.vue"
import SearchResults from "../components/SearchResults.vue"

const routes = [
  { path: "/", component: Home },
  { path: "/songs", component: AllSongs },
  { path: "/artists", component: Artists },
  { path: "/artists/:id", component: Artists },
  { path: "/library", component: Library },
  { path: "/media", component: MediaManagement },
  { path: "/playlists", component: Playlists },
  { path: "/playlists/:id", component: Playlists },
  { path: "/search", component: SearchResults },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})

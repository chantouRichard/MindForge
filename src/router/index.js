import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home.vue";
import Welcome from "../views/Welcome.vue";
import Inspiration from "../views/Inspiration.vue";

const routes = [
  {
    path: "/",
    name: "Welcome",
    component: Welcome,
  },
  {
    path: "/home",
    name: "Home",
    component: Home,
  },
  {
    path:"/inspiration",
    name:"Inspiration",
    component: Inspiration
  }
  // 可以继续添加其他页面
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

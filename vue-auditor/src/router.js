import Vue from "vue";
import VueRouter from "vue-router";

import InstallMetaMask from "@/pages/InstallMetaMask.page.vue";
import Auth from "@/pages/Auth.page.vue";
import Audit from "@/pages/Audit.page.vue";
import History from "@/pages/History.page.vue";
import Pledge from "@/pages/Pledge.page.vue";
import Status from "@/pages/Status.page.vue";

Vue.use(VueRouter);

export const routes = [
    // Auth
    { name: "installMetaMask", path: "/installmetamask", component: InstallMetaMask },
    { name: "auth", path: "/auth", component: Auth },
    { name: "status", path: "/status", component: Status },
    { name: "pledge", path: "/pledge", component: Pledge },
    { name: "audit", path: "/audit", component: Audit },
    { name: "history", path: "/history", component: History },
    { path: "*", redirect: "auth" }
]

const router = new VueRouter({
    routes,
    base: "",
    mode: "history"
})

export default router;
import Vue from "vue";
import VueRouter from "vue-router";

import InstallMetaMask from "@/pages/InstallMetaMask.page.vue";
import Auth from "@/pages/Auth.page.vue";

import Auditors from "@/pages/Auditors.page.vue";

import Audit from "@/pages/Audit.page.vue";
import History from "@/pages/History.page.vue";
import Pledge from "@/pages/Pledge.page.vue";
import Status from "@/pages/Status.page.vue";

Vue.use(VueRouter);

export const routes = [
    //Public
    { name: "dashboard", path: "/dashboard", component: null, meta: { displayInSidenav: "" } },
    // Auth
    { name: "installMetaMask", path: "/installmetamask", component: InstallMetaMask },
    { name: "auth", path: "/auth", component: Auth },
    // Governance views
    { name: "auditors", path: "/auditors", component: Auditors, meta: { displayInSidenav: "Governance" } },
    // Auditors views
    { name: "status", path: "/status", component: Status, meta: { displayInSidenav: "Audit" } },
    { name: "pledge", path: "/pledge", component: Pledge, meta: { displayInSidenav: "Audit" } },
    { name: "audit", path: "/audit", component: Audit, meta: { displayInSidenav: "Audit" } },
    { name: "history", path: "/history", component: History, meta: { displayInSidenav: "Audit" } },
    { path: "*", redirect: "auth" }
]

const router = new VueRouter({
    routes,
    base: "",
    mode: "history"
})

export default router;
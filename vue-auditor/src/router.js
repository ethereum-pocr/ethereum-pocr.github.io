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


const approvedAuditor = ({ store }) => store.state.status.approved;
const isNode = ({ store }) => store.state.auth.isNode;
const isAuditor = ({ store }) => store.state.auth.isAuditor;
const walletIsntConnected = ({ store }) => !store.state.auth.wallet;
// const compose = (...functions) => {
//     return (opts) => {
//         for (const f of functions) {
//             if (!f(opts)) return false;
//         }
//         return true;
//     }
// }
const any = (...functions) => {
    return (opts) => {
        for (const f of functions) {
            if (f(opts)) return true;
        }
        return false;
    }
}

// The order actually matter because it will determine the order in the sidenav
export const routes = [
    //Public
    { name: "dashboard", path: "/dashboard", component: null, meta: { displayInSidenav: "" } },
    // Auth
    { name: "installMetaMask", path: "/installmetamask", component: InstallMetaMask },
    {
        name: "authentication", path: "/auth", component: Auth, meta: {
            displayInSidenav: "",
            hidden: ({ store }) => !walletIsntConnected({ store })
        }
    },
    // Governance views
    {
        name: "auditors", path: "/auditors", component: Auditors, meta: {
            displayInSidenav: "Governance",
            restricted: isNode,
            forceRedirectTo: "dashboard",
            hidden: any(walletIsntConnected, isAuditor)
        }
    },
    // Auditors views
    {
        name: "status", path: "/status", component: Status, meta: {
            displayInSidenav: "Audit",
            restricted: ({ store }) => !isNode({ store }),
            forceRedirectTo: "dashboard",
            hidden: any(walletIsntConnected, isNode)
        }
    },
    {
        name: "pledge", path: "/pledge", component: Pledge, meta: {
            displayInSidenav: "Audit",
            restricted: approvedAuditor,
            forceRedirectTo: "status",
            hidden: any(walletIsntConnected, isNode)
        }
    },
    {
        name: "audit", path: "/audit", component: Audit, meta: {
            displayInSidenav: "Audit",
            restricted: approvedAuditor,
            forceRedirectTo: "status",
            hidden: any(walletIsntConnected, isNode)
        }
    },
    {
        name: "history", path: "/history", component: History, meta: {
            displayInSidenav: "Audit",
            restricted: approvedAuditor,
            forceRedirectTo: "status",
            hidden: any(walletIsntConnected, isNode)
        }
    },
    // GdC: For some unknown reason the redirection should not be 'authentication' directly but it works with dashboard
    { path: "*", redirect: "dashboard" }
]

const router = new VueRouter({
    routes,
    base: "",
    mode: "history"
})

export default router;
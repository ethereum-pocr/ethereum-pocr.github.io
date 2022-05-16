import Vue from "vue";
import VueRouter from "vue-router";

import InstallMetaMask from "@/pages/InstallMetaMask.page.vue";
import Auth from "@/pages/Auth.page.vue";

import Dashboard from "@/pages/Dashboard.page.vue";

import Auditors from "@/pages/Auditors.page.vue";

import Audit from "@/pages/Audit.page.vue";
import History from "@/pages/History.page.vue";
import Pledge from "@/pages/Pledge.page.vue";
import Status from "@/pages/Status.page.vue";
import ConfiscatedPledge from "@/pages/ConfiscatedPledge.page.vue";
import Improvements from "@/pages/Improvements.page.vue";

import { ROLES } from "./lib/const";

Vue.use(VueRouter);


// const approvedAuditor = ({ store }) => store.state.status.approved;
// const isNode = ({ store }) => store.state.auth.isNode;
// const isNotNode = ({ store }) => !isNode({ store });
const walletIsntConnected = ({ store }) => !store.state.auth.wallet;
const hasRole = (role)=>{
    return ({store}) => (store.get("auth/walletRole") == role)
} 
const not = (f)=>{
    return (opts)=>{
        return !f(opts);
    }
}

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
    { name: "dashboard", path: "/dashboard", component: Dashboard, meta: { displayInSidenav: "" } },
    {
        name: "status", path: "/status", component: Status, meta: {
            displayInSidenav: "",
            restricted: not(hasRole(ROLES.VISITOR)),
            forceRedirectTo: "dashboard",
            hidden: hasRole(ROLES.VISITOR)
        }
    }, 
    {
        name: "improvements", path: "/improvements", component: Improvements, meta: {
            displayInSidenav: "",
            forceRedirectTo: "dashboard",
        }
    },

       // Auth
    { name: "installMetaMask", path: "/installmetamask", component: InstallMetaMask },
    {
        name: "authentication", path: "/auth", component: Auth, meta: {
            displayInSidenav: "",
            hidden: ({ store }) => !walletIsntConnected({ store })
        }
    },

    // Node views
    {
        name: "auditors", path: "/auditors", component: Auditors, meta: {
            displayInSidenav: "Governance",
            restricted: any(hasRole(ROLES.AUDITED_NODE), hasRole(ROLES.NEW_NODE)),
            forceRedirectTo: "dashboard",
            hidden: not(any(hasRole(ROLES.AUDITED_NODE), hasRole(ROLES.NEW_NODE)))
        }
    },
    {
        name: "confiscated-pledge", path: "/confiscated", component: ConfiscatedPledge, meta: {
            displayInSidenav: "Governance",
            restricted: any(hasRole(ROLES.AUDITED_NODE), hasRole(ROLES.NEW_NODE)),
            forceRedirectTo: "dashboard",
            hidden: not(any(hasRole(ROLES.AUDITED_NODE), hasRole(ROLES.NEW_NODE)))
        }
    },
    // Auditors views
    {
        name: "pledge", path: "/pledge", component: Pledge, meta: {
            displayInSidenav: "Audit",
            restricted: hasRole(ROLES.APPROVED_AUDITOR),
            forceRedirectTo: "status",
            hidden: not(any(hasRole(ROLES.PENDING_AUDITOR), hasRole(ROLES.APPROVED_AUDITOR)))
        }
    },
    {
        name: "audit", path: "/audit", component: Audit, meta: {
            displayInSidenav: "Audit",
            restricted: hasRole(ROLES.APPROVED_AUDITOR),
            forceRedirectTo: "status",
            hidden: not(any(hasRole(ROLES.PENDING_AUDITOR), hasRole(ROLES.APPROVED_AUDITOR)))
        }
    },
    {
        name: "history", path: "/history", component: History, meta: {
            displayInSidenav: "Audit",
            restricted: hasRole(ROLES.APPROVED_AUDITOR),
            forceRedirectTo: "status",
            hidden: not(any(hasRole(ROLES.PENDING_AUDITOR), hasRole(ROLES.APPROVED_AUDITOR)))
        }
    },
    // GdC: For some unknown reason the redirection should not be 'authentication' directly but it works with dashboard
    { path: "*", redirect: "dashboard" }
]

const router = new VueRouter({
    routes,
    base: "",
    // mode: "history"
})

export default router;
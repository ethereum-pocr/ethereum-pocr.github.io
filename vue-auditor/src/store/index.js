import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify'
import {cleanUpConfig} from "@/lib/config-file"
import { make } from "vuex-pathify";
// import createPersistedState from "vuex-persistedstate";

import nodes from "./nodes"
import auth from "./auth"
import history from "./history";
import pledge from "./pledge"
import status from "./status"
import nodeGovernance from "./nodeGovernance"

Vue.use(Vuex);
let _logIndexCounter=0;

const state = {
    // used for a nicer UX: if this is true, ignore the values above, we probably don't know the actual values yet
    tryingToConnect: false,
    mmIsOpen: false,

    displaySnackbar: false,
    snackbarMessage: "",
    snackbarColor: "error",
    config: undefined,
}
const logs = [];

const store = new Vuex.Store({
    modules: {
        nodes,
        auth,
        history,
        pledge,
        status,
        nodeGovernance
    },
    plugins: [
        pathify.plugin,
        // createPersistedState({ key: "wallets", paths: ["wallets"] })
    ],
    state,
    mutations: make.mutations(state),
    getters: {
        logs() {
            return logs;
        }
    },
    actions: {
        errorFlash({ commit }, message) {
            commit("snackbarMessage", message);
            commit("snackbarColor", "error");
            commit("displaySnackbar", true);
        },
        async fetchConfig({ commit }) {
            try {
                let configUrl = "./config.json";
                const url = new URL(window.location.href);
                if (url.searchParams.has("config")) {
                    const uConf = new URL(url.searchParams.get("config"));
                    configUrl = uConf.href;
                    url.searchParams.delete("config")
                    // window.history.replaceState(null, null, url);
                }
                const res = await fetch(configUrl)
                if( res.status === 200 ) {
                    const config = await res.json();
                    commit("config", await cleanUpConfig(config))
                }
            } catch (error) {
                commit("config", undefined)
            }
        },

        addLog({state}, {type, args}) {
            if (!state.config || (state.config && state.config.activate_log))
                // commit("logs", state.logs.concat([{type, args, key: _logIndexCounter++}]), {silent: true})
                logs.push({type, args, key: _logIndexCounter++})
        }
    }
});
export default store;

const oldLog = console.log;
const oldError = console.error;
const oldWarn = console.warn;
console.log = (...args) => {
    oldLog(...args)
    store.dispatch("addLog", {type:"info", args})
}
console.warn = (...args) => {
    oldWarn(...args)
    store.dispatch("addLog", {type:"warn", args})
}
console.error = (...args) => {
    oldError(...args)
    store.dispatch("addLog", {type:"error", args})
}
import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify'
import {parseUrl} from "@/lib/api"
import { make } from "vuex-pathify";
// import createPersistedState from "vuex-persistedstate";

import nodes from "./nodes"
import auth from "./auth"
import history from "./history";
import pledge from "./pledge"
import status from "./status"
import nodeGovernance from "./nodeGovernance"

Vue.use(Vuex);

const state = {
    // used for a nicer UX: if this is true, ignore the values above, we probably don't know the actual values yet
    tryingToConnect: false,
    mmIsOpen: false,

    displaySnackbar: false,
    snackbarMessage: "",
    snackbarColor: "error",
    config: undefined
}

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
    actions: {
        errorFlash({ commit }, message) {
            commit("snackbarMessage", message);
            commit("snackbarColor", "error");
            commit("displaySnackbar", true);
        },
        async fetchConfig({ commit }) {
            try {
                const res = await fetch("./config.json")
                if( res.status === 200 ) {
                    const config = await res.json();

                    if (!parseUrl(config.nodeUrl, ["http", "https", "ws", "wss"])) {
                        delete config.nodeUrl
                    }
                    if (!parseUrl(config.walletCustodyAPIBaseUrl, ["http", "https"])) {
                        delete config.walletCustodyAPIBaseUrl
                    }

                    commit("config", config)
                }
            } catch (error) {
                commit("config", undefined)
            }
        }
    }
});
export default store;
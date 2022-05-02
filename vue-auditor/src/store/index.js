import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify'
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
        }
    }
});
export default store;
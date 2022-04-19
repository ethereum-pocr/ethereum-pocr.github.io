import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify'
// import createPersistedState from "vuex-persistedstate";

import auth from "./auth"
import status from "./status"

Vue.use(Vuex);

const state = {
    // used for a nicer UX: if this is true, ignore the values above, we probably don't know the actual values yet
    tryingToConnect: false
}

const store = new Vuex.Store({
    modules: {
        auth,
        status
    },
    plugins: [
        pathify.plugin,
        // createPersistedState({ key: "wallets", paths: ["wallets"] })
    ],
    state,
    mutations: {}
});
export default store;
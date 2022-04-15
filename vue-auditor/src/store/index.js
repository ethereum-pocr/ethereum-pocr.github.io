import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify'
// import createPersistedState from "vuex-persistedstate";

import auth from "./auth"

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        auth
    },
    plugins: [
        pathify.plugin,
        // createPersistedState({ key: "wallets", paths: ["wallets"] })
    ],
    state: {

    },
    mutations: {

    },
    actions: {

    },
    getters: {

    },
});
export default store;
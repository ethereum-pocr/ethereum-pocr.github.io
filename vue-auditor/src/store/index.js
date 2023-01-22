import Vue from "vue";
import Vuex from "vuex";

import pathify from '@/plugins/pathify';
import {cleanUpConfig} from "@/lib/config-file";
import { getContractInstance } from "@/lib/api";
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
    initialized: false,
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

        async startInitialization({commit, state, dispatch}) {
            console.log("RootStore", this)
            try {
                commit("initialized", false);
                
                await dispatch("fetchConfig");
                store.commit("auth/contract", getContractInstance())
                await dispatch("auth/detectProvider");
                console.log("Detected provider model", state.auth.providerModel);
                if (state.auth.providerModel == "metamask") {
                    const failMsg = await dispatch("auth/checkNetworkProofOfCarbonReduction");
                    if (failMsg) {
                        console.log("Verification of PoCR netowrk failed:", failMsg);
                        commit("auth/providerModel", "switchMetamask")
                    }
                }

                // record a watcher for state.auth.wallet
                // this watch function first param is a reactive function like if used in the vue template
                this.watch((state)=>state.auth.wallet, ()=>{
                    console.log("wallet has been changed:", state.auth.wallet)
                    dispatch("auth/setWalletAttributes")
                })

                await dispatch("auth/attemptToConnectWallet");
                
                commit("initialized", true);
            } catch (error) {
                await dispatch("errorFlash", "Initialization failed - reload page: "+error.message)
            }
        },

        addLog({state}, {type, args}) {
            if (!state.config || (state.config && state.config.activate_log))
                // commit("logs", state.logs.concat([{type, args, key: _logIndexCounter++}]), {silent: true})
                logs.push({type, args, key: _logIndexCounter++})
        }
    },

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
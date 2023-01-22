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
// let _logIndexCounter=0;

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
            console.log("Inside fetchConfig")
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
                console.error("Could not process the config", error.message)
                commit("config", undefined)
            }
        },

        async startInitialization({commit, state, dispatch}) {
            console.log("RootStore", this)
            try {
                commit("initialized", false);
                
                console.log("Fetching config");
                await dispatch("fetchConfig");
                if (state.config.activate_log) wrapConsoleLogging();
                console.log("Fetching config - done");
                store.commit("auth/contract", getContractInstance())
                console.log("Detecting providers");
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
    },

});
export default store;

export function wrapConsoleLogging() {
    const oldLog = console.log;
    const oldError = console.error;
    const oldWarn = console.warn;
    
    function addLineInBody(payload) {
        if (!window.document) return;
        let logs = window.document.getElementById("--logs--")
        if (!logs) {
            // const body = window.document.getElementsByClassName("body")
            if (!document.body) return;
            logs = document.createElement("div")
            logs.setAttribute("id", "--logs--")
            logs.setAttribute("style", "position: relative; z-index: 100;")
            document.body.insertBefore(logs, document.body.firstElementChild)
        }
        const pre = document.createElement("pre");
        pre.innerHTML=`<b>${payload.type}</b> : ${payload.args.map(a=>(typeof a=="object"?'Object':typeof a == "undefined"?'Undef':a)).join(', ')}`
        logs.appendChild(pre);
    }
    
    console.log = (...args) => {
        oldLog(...args)
        addLineInBody({type:"info", args})
    }
    console.warn = (...args) => {
        oldWarn(...args)
        addLineInBody({type:"warn", args})
    }
    console.error = (...args) => {
        oldError(...args)
        addLineInBody({type:"error", args})
    }
}

// import ready from "document-ready-promise";
import detectEthereumProvider from '@metamask/detect-provider';
import { make } from "vuex-pathify";
import { readOnlyCall, writeCall, handleMMResponse, getWeb3ProviderFromUrl } from "@/lib/api";

import $store from "@/store/index";
import router from "../router.js";

const state = () => ({
    provider: null,
    providerMetamask: null,
    providerDirect: null,
    providerModel: null, // "metamask" or "direct" or "both" (if both are available)
    wallet: null,
    contract: null,
    registered: false,
    // roles
    isNode: false,
    isAuditor: false,
})

const getters = {}

const mutations = make.mutations(state);

const actions = {

    async fetchRole() {
        // get the current address
        const wallet = $store.get("auth/wallet");
        // check if it's Auditor
        const isAuditor = await readOnlyCall("auditorRegistered", wallet);
        // get the value of the footprint
        const Node = await readOnlyCall("footprint", wallet);
        let isNode = false;
        // if value different to 0 then it's a node
        if (Node != 0) isNode = true;
        // set the values to the store
        $store.set("auth/isAuditor", isAuditor);
        $store.set("auth/isNode", isNode);
    },

    async detectProvider() {
        console.log("Before detecting metamask provider");
        try {
            let nbProviders = 0;
            const providerMetamask = await detectEthereumProvider(config);
            if (providerMetamask) {
                nbProviders ++;
            }
            await $store.dispatch("fetchConfig");
            const config = $store.get("config");
 
            let providerDirect = undefined;
            if (config.nodeUrl) {
                providerDirect = getWeb3ProviderFromUrl(config.nodeUrl);
                nbProviders ++;
            }
            if (nbProviders == 0) {
                // router.push({ name: "installMetaMask" }); 
                return;
            }
            if (providerMetamask) {
                providerMetamask.on('accountsChanged', () => window.location.reload())
            }
            $store.set("auth/providerMetamask", providerMetamask);
            $store.set("auth/providerDirect", providerDirect);
            if (nbProviders > 1) {
                $store.set("auth/providerModel", "both");
                // return router.push({ name: "authentication" }); 
            } else {
                const provider = providerDirect || providerMetamask; // will get one that is not null
                const model = providerDirect? "direct" : (providerMetamask? "metamask" : "impossible")
                $store.set("auth/provider", provider);
                $store.set("auth/providerModel", model);
            }
        } catch (error) {
            console.error("Fail detecting the Metamask provider", error.message)
        }
    },

    async attemptToConnectWallet() {
        const addresses = await window.ethereum.request({ method: "eth_accounts" })
        const address = addresses.length > 0 ? addresses[0] : null;
        if (!address) return;
        $store.set("auth/wallet", address);
        // We do it here because stuff breaks if we try to instanciate the interface before we know the address
        return address;
    },

    async openMetaMaskConnectionDialog({ dispatch }) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length === 0) return;
        $store.set("auth/wallet", accounts[0]);
        // it's decided, the provider is metamask
        const provider = $store.get("auth/providerMetamask");
        $store.set("auth/provider", provider);
        $store.set("auth/providerModel", "metamask");
        // TODO: call fetchRole here to do a selective redirect? Or, just assume it's a first connect and don't care.
        dispatch("fetchRole");
        router.push({ name: "dashboard" });
    },

    async openWeb3DirectConnectionDialog({ dispatch }, wallet) {
        $store.set("auth/wallet", wallet);
        // it's decided, the provider is metamask
        const provider = $store.get("auth/providerDirect");
        $store.set("auth/provider", provider);
        $store.set("auth/providerModel", "direct");
        // TODO: call fetchRole here to do a selective redirect? Or, just assume it's a first connect and don't care.
        dispatch("fetchRole");
        router.push({ name: "dashboard" });
    },

    async fetchIsRegistered({ state }) {
        const registered = await handleMMResponse(readOnlyCall("auditorRegistered", state.wallet));
        $store.set("auth/registered", registered);
    },

    async selfRegister({ dispatch }) {
        await handleMMResponse(writeCall("selfRegisterAuditor"));
        dispatch("fetchIsRegistered");
        dispatch("status/fetchIsApproved", null, { root: true });
        dispatch("fetchRole");
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
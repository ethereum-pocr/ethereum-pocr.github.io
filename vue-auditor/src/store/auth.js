// import ready from "document-ready-promise";
import detectEthereumProvider from '@metamask/detect-provider';
import { make } from "vuex-pathify";
import { readOnlyCall, writeCall, handleMMResponse } from "@/lib/api";

import $store from "@/store/index";
import router from "../router.js";

const state = () => ({
    provider: null,
    wallet: null,
    contract: null,
    registered: false,
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
        const provider = await detectEthereumProvider();
        if (!provider) {
            router.push({ name: "installMetaMask" });
            return;
        }
        provider.on('accountsChanged', () => window.location.reload())
        $store.set("auth/provider", provider);
    },

    async attemptToConnectWallet() {
        const addresses = await window.ethereum.request({ method: "eth_accounts" })
        const address = addresses.length > 0 ? addresses[0] : null;
        if (!address) return;
        $store.set("auth/wallet", address);
        // We do it here because stuff breaks if we try to instanciate the interface before we know the address
        return address;
    },

    async openMetaMaskConnectionDialog() {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length === 0) return;
        $store.set("auth/wallet", accounts[0]);
        router.push({ name: "status" });
    },

    async fetchIsRegistered({ state }) {
        const registered = await handleMMResponse(readOnlyCall("auditorRegistered", state.wallet));
        $store.set("auth/registered", registered);
    },

    async selfRegister({ dispatch }) {
        await handleMMResponse(writeCall("selfRegisterAuditor"));
        dispatch("fetchIsRegistered");
        dispatch("status/fetchIsApproved", null, { root: true });
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
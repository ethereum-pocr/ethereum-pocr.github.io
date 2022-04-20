// import ready from "document-ready-promise";
import detectEthereumProvider from '@metamask/detect-provider';
import { make } from "vuex-pathify";
import { readOnlyCall, writeCall } from "@/lib/api";

import $store from "@/store/index";
import router from "../router.js";

const state = () => ({
    provider: null,
    wallet: null,
    contract: null,
    registered: false
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
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
        const registered = await readOnlyCall("auditorRegistered", state.wallet);
        $store.set("auth/registered", registered);
    },

    async selfRegister({ dispatch }) {
        $store.set("mmIsOpen", true);
        await writeCall("selfRegisterAuditor");
        $store.set("mmIsOpen", false);
        dispatch("fetchIsRegistered");
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
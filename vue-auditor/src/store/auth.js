// import ready from "document-ready-promise";
import detectEthereumProvider from '@metamask/detect-provider';
import { make } from "vuex-pathify";
import { readOnlyCall, writeCallWithOptions, handleMMResponse, getWeb3ProviderFromUrl, verifyCustodyAuthentication, getCustodyLastWallets } from "@/lib/api";
import { getDefaultNetwork, changeDefaultNetwork } from "@/lib/config-file";

import $store from "@/store/index";
import router from "../router.js";

const state = () => ({
    provider: null,
    providerMetamask: null,
    providerDirect: null,
    providerModel: null, // "metamask" or "direct" or "both" (if both are available)
    custodyModel: null, // "metamask" or "api" or null if not available
    custodyApiUrl: null, // the url of the custody api when the custody model is "api"
    wallet: null,
    contract: null,
    registered: false,
    // roles
    isNode: false,
    isAuditor: false,
    walletAuthenticationFunction: null
})

const getters = {}

const mutations = make.mutations(state);

// function to generalize the web3 provider and signature api options
async function detectMetamask() {
    const providerMetamask = await detectEthereumProvider();
    if (providerMetamask) {
        providerMetamask.on('accountsChanged', () => window.location.reload())
        return {
            providerModel: "metamask",
            provider: providerMetamask,
            custodyModel: "metamask",
            custodyApiUrl: null
        }
    } else return undefined;
}

async function detectDirectAccess() {
    const config = $store.get("config");
    const defaultNetwork = getDefaultNetwork(config);
    // if we have a nodeUrl, we can connect to the network
    if (defaultNetwork.nodeUrl) {
        // first create a direct provider without the wallet custody
        const result = {
            providerModel: "direct",
            provider: getWeb3ProviderFromUrl(defaultNetwork.nodeUrl),
            custodyModel: null,
            custodyApiUrl: null
        }
        // if we also have the wallet custody, then add it in the result
        if (defaultNetwork.walletCustodyAPIBaseUrl) {
            result.custodyModel = "api",
            result.custodyApiUrl = defaultNetwork.walletCustodyAPIBaseUrl
        } else {
            console.log("Note: No company's wallet custody configured");
        }
        return result;
    } else {
        console.log("Note: No direct web3 access configured");
        return undefined
    }
}

const actions = {

    async fetchRole() {
        // Possibles roles are simple visitor (no wallet), authenticated visitor, auditor, node operator
        // Reset the states
        $store.set("auth/isAuditor", false);
        $store.set("auth/isNode", false);
        // get the current address
        const wallet = $store.get("auth/wallet");
        if (wallet) {
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
        }
    },

    async detectProvider() {
        console.log("Before detecting providers");
        try {
            await $store.dispatch("fetchConfig");
            let nbProviders = 0;

            const providerMetamask = await detectMetamask();
            if (providerMetamask) {
                nbProviders ++;
            }
 
            const providerDirect = await detectDirectAccess();
            if (providerDirect) {
                nbProviders ++;
            } 
            if (nbProviders == 0) {
                // router.push({ name: "installMetaMask" }); 
                return;
            }
            
            $store.set("auth/providerMetamask", providerMetamask);
            $store.set("auth/providerDirect", providerDirect);
            if (nbProviders > 1) {
                $store.set("auth/providerModel", "both");
                // return router.push({ name: "authentication" }); 
            } else { // a single provider detected, can skip the decision process
                const provider = providerDirect || providerMetamask; // will get one that is not null
                $store.set("auth/provider", provider.provider);
                $store.set("auth/providerModel", provider.providerModel);
            }
        } catch (error) {
            console.error("Fail detecting a valid provider", error.message)
        }
    },

    async attemptToConnectWallet() {
        let addresses = [];
        const providerMetamask = $store.get("auth/providerMetamask");
        const providerDirect = $store.get("auth/providerDirect");
        if (providerMetamask) addresses = await window.ethereum.request({ method: "eth_accounts" });
        if (providerDirect && addresses.length == 0) addresses = await getCustodyLastWallets();
        console.log("attemptToConnectWallet", addresses);
        const address = addresses.length > 0 ? addresses[0] : null;
        if (!address) return;
        $store.set("auth/wallet", address);
        // We do it here because stuff breaks if we try to instanciate the interface before we know the address
        return address;
    },

    async openMetaMaskConnectionDialog({ dispatch }) {
        $store.set("auth/wallet", null);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length === 0) return;
        $store.set("auth/wallet", accounts[0]);
        // it's decided, the provider is metamask
        const provider = $store.get("auth/providerMetamask");
        $store.set("auth/provider", provider.provider);
        $store.set("auth/providerModel", provider.providerModel);
        // TODO: call fetchRole here to do a selective redirect? Or, just assume it's a first connect and don't care.
        dispatch("fetchRole");
        router.push({ name: "dashboard" });
    },

    async openWeb3DirectConnectionDialog({ dispatch }, {wallet, password, nodeUrl}) {
        // force reset the wallet
        $store.set("auth/wallet", null);
        // update the default config
        let config = $store.get("config");
        config = changeDefaultNetwork(config, nodeUrl);
        $store.set("config", config);

        const provider = await detectDirectAccess(); // read again the default config now that it is chaged
        $store.set("auth/provider", provider.provider);
        $store.set("auth/providerModel", provider.providerModel);
        
        if (provider.custodyModel == "api") {
            const token = await verifyCustodyAuthentication(wallet, password)
            // console.log("openWeb3DirectConnectionDialog", wallet, password, token);
            if (token) {
                $store.set("auth/wallet", wallet);
            }
        }
        dispatch("fetchRole");
        router.push({ name: "dashboard" });
    },

    async fetchIsRegistered({ state }) {
        const registered = await handleMMResponse(readOnlyCall("auditorRegistered", state.wallet));
        $store.set("auth/registered", registered);
    },

    async selfRegister({ dispatch }) {
        await handleMMResponse(writeCallWithOptions("selfRegisterAuditor", {maxGas:100000}));
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
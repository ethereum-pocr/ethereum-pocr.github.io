// import ready from "document-ready-promise";
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from "web3";
import { make } from "vuex-pathify";
import { readOnlyCall, writeCallWithOptions, handleMMResponse, getWeb3ProviderFromUrl, verifyCustodyAuthentication, getCustodyLastWallets } from "@/lib/api";
import { getDefaultNetwork, changeDefaultNetwork, getExplorerUrl } from "@/lib/config-file";

import $store from "@/store/index";
import router from "../router.js";
import {ROLES} from "../lib/const"
import { poaBlockHashToSealerInfo } from '@root/../pocr-utils/build/index.js';
import { intf, getContractInstance } from '../lib/api.js';

const state = () => ({
    web3: null, // the web3 instance to avoid recreating it each time, because it has a side effect on the events of the provider
    intf: null, // similarly the intf instance should not be recreated each time
    provider: null,
    providerMetamask: null,
    providerDirect: null,
    providerModel: null, // "metamask" or "direct" or "both" (if both are available)
    custodyModel: null, // "metamask" or "api" or null if not available
    custodyApiUrl: null, // the url of the custody api when the custody model is "api"
    wallet: null,
    delegatedWallet: null,
    contract: null,
    registered: false,
    // roles
    isNode: false,
    isVoterNode: false,
    isAuditor: false,
    isAuditorApproved: false,
    walletAuthenticationFunction: null
})

const getters = {
    walletRole(state) {
        if (!state.wallet) return ROLES.VISITOR;
        if (state.isVoterNode) return ROLES.AUDITED_NODE;
        if (state.isNode) return ROLES.NEW_NODE;
        if (state.isAuditorApproved) return ROLES.APPROVED_AUDITOR;
        if (state.isAuditor) return ROLES.PENDING_AUDITOR;

        return ROLES.USER_CONNECTED;
    },
    explorerUrl(state) {
        if (state.providerModel == "metamask") {
            return state.providerMetamask.explorerUrl;
        }
        if (state.providerModel == "direct") {
            return state.providerDirect.explorerUrl;
        }
        return undefined;
    },
    chainName(state) {
        let chainId=0;
        switch (state.providerModel) {
            case "direct": chainId=state.providerDirect.chainID; break;
            case "metamask": chainId=state.providerMetamask.chainID; break;
        }
        switch (chainId) {
            case 1804: return "Kerleano";
            case 2606: return "PoCRNet";
        }
        return "Unknown"
    }
}

const mutations = make.mutations(state);

// function to generalize the web3 provider and signature api options
async function detectMetamask() {
    const config = $store.get("config");
    let providerMetamask = undefined;
    try {
        providerMetamask = await detectEthereumProvider({timeout:2000});
    } catch (error) {
        console.log("fail detectEthereumProvider");
    }
    if (providerMetamask) {
        providerMetamask.on("connect", chaininfo=>{
            console.log("Metamask chain info", chaininfo);
        })
        providerMetamask.on('accountsChanged', () => window.location.reload())
        providerMetamask.on('chainChanged', () => window.location = new URL(window.location.pathname, window.location.origin).href)
        const chainID = Number(providerMetamask.chainId)
        
        return {
            providerModel: "metamask",
            provider: providerMetamask,
            custodyModel: "metamask",
            custodyApiUrl: null,
            chainID,
            explorerUrl: getExplorerUrl(config, chainID)
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
            custodyApiUrl: null,
            chainID: Number.parseInt(defaultNetwork.chainID),
            explorerUrl: getExplorerUrl(config) // will use the default network
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

    async checkNetworkProofOfCarbonReduction() {
        const web3 = $store.get("auth/web3");
        const carbonFootprint = $store.get("auth/contract");
        
        try {
            // try getting the blocknumber
            const blockNumber = await web3.eth.getBlockNumber()
            // try getting the poaInfo of the block
            const block = await web3.eth.getBlock(blockNumber);
            if (typeof block.difficulty === "string" && !block.difficulty.startsWith('0x')) block.difficulty = Number.parseInt(block.difficulty);
            poaBlockHashToSealerInfo(block);
            // try getting the number of sealers/nodes
            await carbonFootprint.nbNodes(intf().call())
            
        } catch (error) {
            console.error("Fail in checkNetworkProofOfCarbonReduction", error);
            return error.message;
        }
        return false;
    },

    async fetchRole() {
        console.log("fetchRole called");
        // Possibles roles are simple visitor (no wallet), authenticated visitor, auditor, node operator
        // Reset the states
        $store.set("auth/isAuditor", false);
        $store.set("auth/isNode", false);
        $store.set("auth/isVoterNode", false);

        // get the current address
        const wallet = $store.get("auth/wallet");
        if (wallet) {
            // check if it's Auditor
            const isAuditor = await readOnlyCall("auditorRegistered", wallet);
            const isAuditorApproved = await readOnlyCall("auditorApproved", wallet);
            // see if the node is a sealer and get the value of the footprint if it exists
            let sealerNode = await $store.dispatch("nodes/fetchOneNodeInfo", wallet);
            // console.log("sealerNode", sealerNode);
            if (!sealerNode) { // wallet is not a node, is the wallet a delegate of a node
                try {
                    const delegateOf = await readOnlyCall("delegateOf", wallet);
                    // console.log("retrieved delegateOf", delegateOf);
                    sealerNode = await $store.dispatch("nodes/fetchOneNodeInfo", delegateOf);
                } catch (error) {
                    // console.log("retrieved delegateOf impossible - ealier version of the genesis");
                }
            }
            if (sealerNode) { // wallet found as sealer or delegate of a sealer
                $store.set("auth/isNode", true);
                let isVoterNode = false;
                try { // to keep compatibility with the old genesis
                    isVoterNode = await readOnlyCall("canActAsSealerNode", wallet);
                } catch (error) {
                    const footprint = await readOnlyCall("footprint", wallet);
                    isVoterNode = footprint > 0;
                }
                $store.set("auth/isVoterNode", isVoterNode);
                $store.set("auth/delegatedWallet", sealerNode.address);
            } 
            // set the values to the store
            $store.set("auth/isAuditor", isAuditor);
            $store.set("auth/isAuditorApproved", isAuditorApproved);

        }
    },

    setConnection(store, provider) {
        $store.set("auth/provider", provider.provider);
        $store.set("auth/providerModel", provider.providerModel);
        const web3 = new Web3(provider.provider);
        web3.eth.ens = null
        $store.set("auth/web3", web3);
        window.myWeb3 = web3;
        $store.set("auth/intf", null); // will created on the fly by the intf() function
    },

    async detectProvider({dispatch, commit, state}) {
        // Just to make sure, if you do not have the smart contract instance yet, we instanciate it.
        if (!state.contract) {
            commit("contract", getContractInstance())
        }  
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
                dispatch("setConnection", provider);
                // $store.set("auth/provider", provider.provider);
                // $store.set("auth/providerModel", provider.providerModel);
            }
        } catch (error) {
            console.error("Fail detecting a valid provider", error.message)
        }
    },

    async attemptToConnectWallet() {
        let addresses = [];
        // const providerMetamask = $store.get("auth/providerMetamask");
        // const providerDirect = $store.get("auth/providerDirect");
        const model = $store.get("auth/providerModel");
        if (model == "metamask") addresses = await window.ethereum.request({ method: "eth_accounts" });
        if (model == "direct" && addresses.length == 0) addresses = await getCustodyLastWallets();
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
        dispatch("setConnection", provider);
        // $store.set("auth/provider", provider.provider);
        // $store.set("auth/providerModel", provider.providerModel);
        // TODO: call fetchRole here to do a selective redirect? Or, just assume it's a first connect and don't care.
        await dispatch("fetchRole");
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
        dispatch("setConnection", provider);
        // $store.set("auth/provider", provider.provider);
        // $store.set("auth/providerModel", provider.providerModel);
        
        if (provider.custodyModel == "api") {
            const token = await verifyCustodyAuthentication(wallet, password)
            // console.log("openWeb3DirectConnectionDialog", wallet, password, token);
            if (token) {
                $store.set("auth/wallet", wallet);
            }
        }
        await dispatch("fetchRole");
        router.push({ name: "dashboard" });
    },

    async disconnect() {
        await router.push({ name: "authentication" });
        $store.set("auth/wallet", null);
    },

    async fetchIsRegistered({ state }) {
        const registered = await handleMMResponse(readOnlyCall("auditorRegistered", state.wallet));
        $store.set("auth/registered", registered);
    },

    async selfRegister({ dispatch }) {
        await handleMMResponse(writeCallWithOptions("selfRegisterAuditor", {maxGas:200000}));
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
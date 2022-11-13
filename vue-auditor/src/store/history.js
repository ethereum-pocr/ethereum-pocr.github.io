import { make } from "vuex-pathify";
import { governanceAddress } from "@/lib/const";
import Web3 from "web3";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import allContracts from "sc-carbon-footprint";
import { toEther } from "@/lib/numbers";

// eslint-disable-next-line 
import { SmartContractInstance } from "@saturn-chain/smart-contract" // needed only for typings resolution in the code
import $store from "@/store/index";

const state = () => ({
    pledgeHistory: [],
    footprintHistory: []
})

const getters = {}

const mutations = {
    ...make.mutations(state),
    appendFootprint: (state, value) => {
        state.footprintHistory.push(value)
    },
    appendPledge: (state, value) => {
        state.pledgeHistory.push(value)
    },
};

const actions = {
    fetchAllValues({ dispatch }) {
        const prov = new Web3FunctionProvider($store.get("auth/provider"), ()=>Promise.resolve($store.get("auth/wallet")))
        const contract = allContracts.get("Governance").at(governanceAddress);

        dispatch("fetchFootprintHistory", {contract, prov});
        dispatch("fetchPledgeHistory", {contract, prov});
    },

    /**
     * Get the list of setting footprint from the begining.     
     * TODO: Replace by a pagination scheme 
     * @param {*} empty 
     * @param {{contract:SmartContractInstance, prov:Web3FunctionProvider} param1 
     */
    async fetchFootprintHistory({commit, rootState}, {contract, prov}) {
        const web3 = new Web3($store.get("auth/provider"));
        const sealers = rootState.nodes.sealers;
        const wallet = rootState.auth.wallet;
        $store.set("history/footprintHistory", []);
        contract.events.CarbonFootprintUpdate(prov.get({fromBlock: 1}), {})
        .on("log", async log=>{
            // console.log("get logs ", log);
            const tx = await web3.eth.getTransaction(log.transactionHash)
            // console.log('tx=', tx);
            const footprint = {
                blockNumber: log.blockNumber,
                auditor: tx?tx.from.toLowerCase():'no sealer!',
                node: log.returnValues.node.toLowerCase(),
                footprint: log.returnValues.footprint,
                txHash: log.transactionHash
            };
            const foundSealer = sealers.find(s=>s.address == footprint.node);
            if (foundSealer) {
                footprint.nodeName = foundSealer.vanity.custom;
            } else {
                footprint.nodeName = 'Not a node';
            }
            if (footprint.auditor == wallet) {
                footprint.auditorName = "Me";
            } else {
                footprint.auditorName = footprint.auditor;
            }
            commit("appendFootprint", footprint);
        })
    },

    /**
     * Get the list of pledging from the begining.     
     * TODO: Replace by a pagination scheme 
     * @param {*} empty 
     * @param {{contract:SmartContractInstance, prov:Web3FunctionProvider} param1 
     */
    async fetchPledgeHistory({commit, rootState}, {contract, prov}) {
        const wallet = rootState.auth.wallet;
        $store.set("history/pledgeHistory", []);
        // get the logs of the current auditor only
        contract.events.AmountPledged(prov.get({fromBlock: 1}), {from: wallet})
        .on("log", async log=>{
            // console.log("get logs ", log, "filter", {from: wallet});
            const pledge = {
                blockNumber: log.blockNumber,
                auditor: log.returnValues.from,
                pledge: toEther(log.returnValues.amountAdded)-toEther(log.returnValues.amountRemoved),
                total: toEther(log.returnValues.total),
                txHash: log.transactionHash
            };
            commit("appendPledge", pledge)
        })
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
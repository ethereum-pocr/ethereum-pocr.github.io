import { make } from "vuex-pathify";
import { governanceAddress } from "@/lib/api";
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
    async fetchFootprintHistory({commit}, {contract, prov}) {
        $store.set("history/footprintHistory", []);
        contract.events.CarbonFootprintUpdate(prov.get({fromBlock: 1}), {})
        .on("log", log=>{
            // console.log("get logs ", log);
            const footprint = {
                blockNumber: log.blockNumber,
                node: log.returnValues.node,
                footprint: log.returnValues.footprint
            };
            commit("appendFootprint", footprint);
        })
    },

    /**
     * Get the list of pledging from the begining.     
     * TODO: Replace by a pagination scheme 
     * @param {*} empty 
     * @param {{contract:SmartContractInstance, prov:Web3FunctionProvider} param1 
     */
    async fetchPledgeHistory({commit}, {contract, prov}) {
        $store.set("history/pledgeHistory", []);
        // get the logs of the current auditor only
        contract.events.AmountPledged(prov.get({fromBlock: 1}), {from: await prov.account()})
        .on("log", log=>{
            // console.log("get logs ", log);
            const pledge = {
                blockNumber: log.blockNumber,
                node: log.returnValues.from,
                pledge: toEther(log.returnValues.amount),
                total: toEther(log.returnValues.total)
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
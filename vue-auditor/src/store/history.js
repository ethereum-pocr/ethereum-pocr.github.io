import { make } from "vuex-pathify";
import { governanceAddress } from "@/lib/api";
import Web3 from "web3";
import combinedFile from "../contracts/combined";
import $store from "@/store/index";

const state = () => ({
    pledgeHistory: [],
    footprintHistory: []
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    fetchAllValues({ dispatch }) {
        const web3 = new Web3($store.get("auth/provider"));

        const contract = new web3.eth.Contract(
            combinedFile.contracts["src/Governance.sol:Governance"].abi,
            governanceAddress
        );

        dispatch("fetchFootprintHistory", contract);
        dispatch("fetchPledgeHistory", contract);
    },

    async fetchFootprintHistory(empty, web3ContractInstance) {
        const res = await web3ContractInstance.getPastEvents("CarbonFootprintUpdate", {
            fromBlock: 1,
        });
        const data = res
            .map(r => ({
                blockNumber: r.blockNumber,
                node: r.returnValues[0],
                footprint: r.returnValues[1]
            }))
        $store.set("history/footprintHistory", data);
    },

    async fetchPledgeHistory(empty, web3ContractInstance) {
        const res = await web3ContractInstance.getPastEvents("AmountPledged", {
            fromBlock: 1,
        });
        const data = res
            .map(r => ({
                blockNumber: r.blockNumber,
                node: r.returnValues[0],
                pledge: r.returnValues[1]
            }))
        $store.set("history/pledgeHistory", data);
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
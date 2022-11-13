import { make } from "vuex-pathify";
import { readOnlyCall, writeCall, writeCallWithOptions, handleMMResponse } from "@/lib/api";
import $store from "@/store/index";
import { toWei, toEther } from "@/lib/numbers";
import { getWalletBalance } from "@/lib/api";

const state = () => ({
    balance: 0,
    minPledgeAmount: 0,
    pledgedAmount: 0,
    redeemBool: false,
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    fetchAllValues({ dispatch }) {
        dispatch("fetchBalance");
        dispatch("fetchMinPledgeAmount");
        dispatch("fetchPledgedAmount");
        dispatch("fetchCanTransferPledge");
    },

    async fetchBalance({ rootState }) {
        const balance = await getWalletBalance(rootState.auth.wallet);
        $store.set("pledge/balance", balance);
    },

    async fetchCanTransferPledge() {
        const wallet = $store.get("auth/wallet");
        const redeemBool = await readOnlyCall("canTransferPledge", wallet,"1");
        console.log("just trying", redeemBool);
        $store.set("pledge/redeemBool", redeemBool);
    },

    async fetchMinPledgeAmount() {
        const wallet = $store.get("auth/wallet");
        const minPledgeAmount = await readOnlyCall("minPledgeAmountToAuditNode", wallet);
        $store.set("pledge/minPledgeAmount", minPledgeAmount);
    },

    async fetchPledgedAmount() {
        const wallet = $store.get("auth/wallet");
        const pledgedAmount = await readOnlyCall("pledgedAmount", wallet);
        $store.set("pledge/pledgedAmount", toEther(pledgedAmount));
    },

    async addToPledge({ dispatch }, amount) {
        console.log("Pledging", amount)
        await handleMMResponse(writeCallWithOptions("pledge", { amount: toWei(amount, "ether") }));
        dispatch("fetchPledgedAmount");
        dispatch("fetchBalance");
    },

    async redeemPledge({ dispatch }) {
        // when the smart contract is redeployed with the getPledgeBack function replace the below code
        // const wallet = $store.get("auth/wallet");
        // const amount = $store.get("pledge/pledgedAmount");
        await handleMMResponse(writeCall("getPledgeBack"));
        // replace with:
        // await handleMMResponse(writeCall("getPledgeBack"));
        dispatch("fetchPledgedAmount");
        dispatch("fetchBalance");
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
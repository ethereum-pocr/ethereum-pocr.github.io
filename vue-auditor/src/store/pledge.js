import { make } from "vuex-pathify";
import { readOnlyCall, writeCall, writeCallWithOptions, handleMMResponse } from "@/lib/api";
import $store from "@/store/index";
import { toWei } from "@/lib/numbers";
import { getWalletBalance } from "@/lib/api";

const state = () => ({
    balance: 0,
    minPledgeAmount: 0,
    pledgedAmount: 0
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    fetchAllValues({ dispatch }) {
        dispatch("fetchBalance");
        dispatch("fetchMinPledgeAmount");
        dispatch("fetchPledgedAmount");
    },

    async fetchBalance({ rootState }) {
        const balance = await getWalletBalance(rootState.auth.wallet);
        $store.set("pledge/balance", balance);
    },

    async fetchMinPledgeAmount() {
        const wallet = $store.get("auth/wallet");
        const minPledgeAmount = await readOnlyCall("minPledgeAmountToAuditNode", wallet);
        $store.set("pledge/minPledgeAmount", minPledgeAmount);
    },

    async fetchPledgedAmount() {
        const wallet = $store.get("auth/wallet");
        const pledgedAmount = await readOnlyCall("pledgedAmount", wallet);
        $store.set("pledge/pledgedAmount", pledgedAmount);
    },

    async addToPledge({ dispatch }, amount) {
        await handleMMResponse(writeCallWithOptions("pledge", { amount: toWei(amount) }));
        dispatch("fetchPledgedAmount");
    },

    async redeemPledge({ dispatch }) {
        await handleMMResponse(writeCall("getPledgeBack"));
        dispatch("fetchPledgedAmount");
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
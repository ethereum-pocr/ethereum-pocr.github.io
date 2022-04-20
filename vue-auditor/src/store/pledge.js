import { make } from "vuex-pathify";
import { readOnlyCall } from "@/lib/api";
import $store from "@/store/index";
import { toEther } from "@/lib/numbers";
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
        $store.set("pledge/balance", toEther(balance).toFixed());
    },

    async fetchMinPledgeAmount() {
        const wallet = $store.get("auth/wallet");
        const minPledgeAmount = await readOnlyCall("minPledgeAmountToAuditNode", wallet);
        $store.set("pledge/minPledgeAmount", toEther(minPledgeAmount).toFixed());
    },

    async fetchPledgedAmount() {
        const wallet = $store.get("auth/wallet");
        const pledgedAmount = await readOnlyCall("pledgedAmount", wallet);
        $store.set("pledge/pledgedAmount", toEther(pledgedAmount).toFixed());
    },


}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
import { make } from "vuex-pathify";
import { readOnlyCall } from "@/lib/api";
import $store from "@/store/index";

const state = () => ({
    approved: false,
    approbationVotes: 0
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    async fetchIsApproved() {
        const wallet = $store.get("auth/wallet");
        const approved = await readOnlyCall("auditorApproved", wallet);

        $store.set("status/approved", approved);
    },
    async fetchApprobationVotes() {
        const wallet = $store.get("auth/wallet");
        const votes = await readOnlyCall("auditorVotes", wallet);

        $store.set("status/approbationVotes", Number(votes));
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
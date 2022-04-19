import { make } from "vuex-pathify";
// import $store from "@/store/index";

const state = () => ({
    approved: false,
    approbationVotes: 0
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    async getIsApproved() {

    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
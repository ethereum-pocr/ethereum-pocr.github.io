import detectEthereumProvider from '@metamask/detect-provider';
import { make } from "vuex-pathify";

import $store from "@/store/index";
// import router from "../router.js";

const state = () => ({
    provider: null,
    wallet: null,
    approved: false,
    approbationVotes: 0,
    // used for a nicer UX: if this is true, ignore the values above, we probably don't know the actual values yet
    tryingToConnect: false
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    async detectProvider() {
        const provider = await detectEthereumProvider();
        if (!provider) return;
        $store.set("auth/provider", provider);
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
import { make } from "vuex-pathify";
import { toEther } from "@/lib/numbers";
import {
    handleMMResponse,
    readOnlyCall,
    writeCallWithOptions,
} from "@/lib/api";
import $store from "@/store/index";

const state = () => ({
    nbAuditors: 0,
    auditors: [],
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    async fetchAllAuditorsValues({ dispatch }) {
        await dispatch("fetchNbAuditors");
        await dispatch("fetchAuditorsInfos");
    },

    async fetchNbAuditors() {
        const nbAuditors = await readOnlyCall("nbAuditors");
        $store.set("nodeGovernance/nbAuditors", nbAuditors);
    },

    async fetchAuditorsInfos() {
        const nbAuditors = await readOnlyCall("nbAuditors");
        const nodeAdr = $store.get("auth/wallet");
        const minVotes = Math.floor((await readOnlyCall("nbNodes")) / 2) + 1;
        const auditors = [];
        for (let i = 0; i < nbAuditors; i++) {
            const address = await readOnlyCall("auditorAddress", i);
            const nbVotes = await readOnlyCall("auditorVotes", address);
            const currentVote = await readOnlyCall("currentAuditorVote", address, nodeAdr);
            const isApproved = await readOnlyCall("auditorApproved", address);
            auditors[i] = {
                address,
                nbVotes,
                minVotes,
                currentVote,
                isApproved
            };
        }
        $store.set("nodeGovernance/auditors", auditors);
    },

    async fetchConfiscatedPledge() {
        const confiscated = await readOnlyCall("confiscatedAmount");
        console.log("confiscated pledge", confiscated, typeof confiscated);
        return toEther(confiscated)
    },

    async voteAuditor(context, {auditorAddress, accept}) {
        return handleMMResponse(writeCallWithOptions("voteAuditor", {maxGas:200000}, auditorAddress, accept));
    }

}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
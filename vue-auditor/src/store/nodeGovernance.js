import { make } from "vuex-pathify";
import {
    readOnlyCall, writeCall,
    // writeCall,
    // writeCallWithOptions,
    // handleMMResponse
} from "@/lib/api";
import $store from "@/store/index";
// import { toWei, toEther } from "@/lib/numbers";
// import { getWalletBalance } from "@/lib/api";

const state = () => ({
    nbAuditors: 0,
    auditors: [],
})

const getters = {}

const mutations = make.mutations(state);

const actions = {
    fetchAllAuditorsValues({ dispatch }) {
        console.log('before dispatch fetch auditors gouv actions');
        dispatch("fetchNbAuditors");
        // dispatch("fetchAuditorsInfos");
        console.log('after dispatch fetch auditors gouv actions');
        // dispatch("fetchPledgedAmount");
        // dispatch("fetchCanTransferPledge");
    },

    async fetchNbAuditors() {
        console.log('+++++before readOnlyCall nbNode in nbAuditors');
        const nbNode = await readOnlyCall("nbNodes");
        console.log(`+++++after readOnlyCall nbNode in nbAuditors : ${nbNode}`);
        console.log('+++++before readOnlyCall nbAuditors');
        const nbAuditors = await writeCall("nbAuditors");
        console.log(`+++++after readOnlyCall nbAuditors : ${nbAuditors}`);
        $store.set("nodeGovernance/nbAuditors", nbAuditors);
    },

    async fetchAuditorsInfos() {
        console.log('before readOnlyCall loop auditors');
        const nbAuditors = $store.get("nodeGovernance/nbAuditors");
        console.log(`nbAuditors: ${nbAuditors}`);
        const auditors = {};
        for (let i = 0; i < nbAuditors; i++) {
            console.log(`before loop ${i} auditors call`);
            const address = await readOnlyCall("auditorAddress", i);
            console.log(`after adress call : ${address}`);
            const nbVotes = await readOnlyCall("auditorVotes", address);
            console.log(`after nbVotes call : ${nbVotes}`);
            const currentVote = await readOnlyCall("currentAuditorVote", address);
            console.log(`after currentVote call : ${currentVote}`);
            const isApproved = await readOnlyCall("auditorApproved", address);
            console.log(`after isApproved call : ${isApproved}`);
            console.log(`after loop ${i} auditors call`);
            auditors[address] = {
                address,
                nbVotes,
                currentVote,
                isApproved
            };
        }
        console.log(`after readOnlyCall loop auditors`);
        console.dir(auditors);
        // const redeemBool = await readOnlyCall("canTransferPledge", wallet,"1");
        // console.log("just trying", redeemBool);
        $store.set("nodeGovernance/auditors", auditors);
    },

    // async fetchMinPledgeAmount() {
    //     const wallet = $store.get("auth/wallet");
    //     const minPledgeAmount = await readOnlyCall("minPledgeAmountToAuditNode", wallet);
    //     $store.set("pledge/minPledgeAmount", minPledgeAmount);
    // },
    //
    // async fetchPledgedAmount() {
    //     const wallet = $store.get("auth/wallet");
    //     const pledgedAmount = await readOnlyCall("pledgedAmount", wallet);
    //     $store.set("pledge/pledgedAmount", toEther(pledgedAmount));
    // },
    //
    // async addToPledge({ dispatch }, amount) {
    //     console.log("Pledging", amount)
    //     await handleMMResponse(writeCallWithOptions("pledge", { amount: toWei(amount, "ether") }));
    //     dispatch("fetchPledgedAmount");
    // },
    //
    // async redeemPledge({ dispatch }) {
    //     // when the smart contract is redeployed with the getPledgeBack function replace the below code
    //     const wallet = $store.get("auth/wallet");
    //     const amount = $store.get("pledge/pledgedAmount");
    //     await  handleMMResponse(writeCall("transferPledge", wallet, amount));
    //     // replace with:
    //     // await handleMMResponse(writeCall("getPledgeBack"));
    //     dispatch("fetchPledgedAmount");
    // }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
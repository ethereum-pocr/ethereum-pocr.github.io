import { make } from "vuex-pathify";
import {
    handleMMResponse,
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
    async fetchAllAuditorsValues({ dispatch }) {
        console.log('xxx before fetch nbAudit');
        await dispatch("fetchNbAuditors");
        console.log('xxx before AuditInfos');
        await dispatch("fetchAuditorsInfos");
        console.log('xxx  after dispatch');
        // dispatch("fetchPledgedAmount");
        // dispatch("fetchCanTransferPledge");
    },

    async fetchNbAuditors() {
        const nbAuditors = await readOnlyCall("nbAuditors");
        console.log(`+++ after readOnlyCall nbAuditors : ${nbAuditors}`);
        $store.set("nodeGovernance/nbAuditors", nbAuditors);
    },

    async fetchAuditorsInfos() {
        console.log('*** before readOnlyCall loop auditors');
        const nbAuditors = await readOnlyCall("nbAuditors");
        const nodeAdr = $store.get("auth/wallet");
        const minVotes = Math.floor((await readOnlyCall("nbNodes")) / 2) + 1;
        console.log(`*** nbAuditors: ${nbAuditors}`);
        console.log(`*** nodeAdr: ${nodeAdr}`);
        const auditors = [];
        for (let i = 0; i < nbAuditors; i++) {
            console.log(`*** before loop ${i} auditors call`);
            const address = await readOnlyCall("auditorAddress", i);
            console.log(`*** after adress call : ${address}`);
            const nbVotes = await readOnlyCall("auditorVotes", address);
            console.log(`*** after nbVotes call : ${nbVotes}`);
            const currentVote = await readOnlyCall("currentAuditorVote", address, nodeAdr);
            console.log(`*** after currentVote call : ${currentVote}`);
            const isApproved = await readOnlyCall("auditorApproved", address);
            console.log(`*** after isApproved call : ${isApproved}`);
            console.log(`*** after loop ${i} auditors call`);
            auditors[i] = {
                address,
                nbVotes,
                minVotes,
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

    async voteAuditor(context, {auditorAddress, accept}) {
        console.log(`calling voteAuditor for auditor ${auditorAddress} with value ${accept}`)
        const res = await handleMMResponse(writeCall("voteAuditor", auditorAddress, accept));
        console.log(`res voteAuditor -> ${res}`);
    }

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
import Web3 from "web3";
import { make } from "vuex-pathify";
import { poaBlockHashToSealerInfo } from "pocr-utils";
import { readOnlyCall, intf as _intf, writeCall, handleMMResponse } from "@/lib/api";
import $store from "@/store/index";

const state = () => ({
    nbOfNodes: 0,
    totalFootprint: 0,
    sealers: []
})

const getters = {}

const mutations = make.mutations(state);

async function processBlock(web3, intf, block) {
    // console.log("Receiving block", block.number)
    const carbonFootprint = $store.get("auth/contract");

    const data = { block, sealer: undefined }
    try {
        if (typeof block.difficulty === "string" && !block.difficulty.startsWith('0x')) block.difficulty = Number.parseInt(block.difficulty);
        data.sealer = poaBlockHashToSealerInfo(block);
        const blockNumber = typeof block.number === "string" ? Number.parseInt(block.number) : block.number;
        const balance = web3.utils.toBN(await web3.eth.getBalance(data.sealer.address, blockNumber))
        const totalCrypto = web3.utils.toBN(await web3.eth.getBalance(carbonFootprint.deployedAt, blockNumber))
        const totalCryptoB4 = web3.utils.toBN(await web3.eth.getBalance(carbonFootprint.deployedAt, blockNumber - 1))
        const delta = Number.parseFloat(web3.utils.fromWei(totalCrypto.sub(totalCryptoB4)));
        const bal = Number.parseFloat(web3.utils.fromWei(balance, "ether"))
        const footprint = await carbonFootprint.footprint(intf.call(), data.sealer.address)
        const totalFootprint = await carbonFootprint.totalFootprint(intf.call())
        const nbNodes = await carbonFootprint.nbNodes(intf.call())
        data.sealer.footprint = Number.parseFloat(footprint);
        data.sealer.balance = bal
        data.totalFootprint = Number.parseInt(totalFootprint)
        data.totalCrypto = Number.parseFloat(web3.utils.fromWei(totalCrypto, "ether"))
        data.nbNodes = Number.parseInt(nbNodes)
        data.sealer.lastReward = delta //normalRewardForFootprint(data.sealer.footprint, data.totalFootprint, data.nbNodes);
        data.receivedAt = Date.now()
    } catch (error) {
        console.warn("Error in preparing block", error)
    }
    return data;
}

const actions = {
    fetchAllValues({ dispatch }) {
        dispatch("fetchNumberOfNodes");
        dispatch("fetchTotalFootprint");
        dispatch("fetchNodeInformations");
    },

    async fetchNumberOfNodes() {
        const nbNodes = await readOnlyCall("nbNodes");
        $store.set("audit/nbOfNodes", nbNodes);
    },

    async fetchTotalFootprint() {
        const totalFootprint = await readOnlyCall("totalFootprint");
        $store.set("audit/totalFootprint", totalFootprint);
    },

    async fetchNodeInformations({ rootState }) {
        const web3 = new Web3(rootState.auth.provider);
        const blockNumber = await web3.eth.getBlockNumber();
        const intf = _intf(rootState.auth.provider);

        const sealers = {};

        // const maxBlocksToCheck = 10; // cannot use a fixed amount if they are more than 10 nodes it will not pick them all
        let i = 0;
        let maxSealerSeenCounter = 0;
        while (maxSealerSeenCounter <= 2) { // makes at least 2 full loops of PoA signature
            const index = blockNumber - i;
            const block = await web3.eth.getBlock(index, false);
            const data = await processBlock(web3, intf, block);
            console.log("block", data.block.number, "sealer", data.sealer);
            if (!sealers[data.sealer.address]) {
                sealers[data.sealer.address] = data.sealer;
                sealers[data.sealer.address].seenCounter = 1;
            } else {
                sealers[data.sealer.address].seenCounter++;
            }
            // capture the max of the node seen
            if (maxSealerSeenCounter < sealers[data.sealer.address].seenCounter) maxSealerSeenCounter = sealers[data.sealer.address].seenCounter;
            i++;
        }
        const sortedSealers = Object.values(sealers).sort((a, b) => a.footprint < b.footprint);
        // console.log(sortedSealers.map(s => s.footprint));
        $store.set("audit/sealers", sortedSealers);
    },

    async updateFootprint({ dispatch }, { sealerAddress, footprint }) {
        await handleMMResponse(writeCall("setFootprint", sealerAddress, footprint));
        dispatch("fetchNodeInformations");
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
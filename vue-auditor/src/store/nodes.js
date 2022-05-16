import Web3 from "web3";
import { make } from "vuex-pathify";
import { poaBlockHashToSealerInfo } from "pocr-utils";
import { readOnlyCall, intf as _intf, writeCall, handleMMResponse } from "@/lib/api";
import $store from "@/store/index";

const MAX_BLOCKS_TO_KEEP = 30;

const state = () => ({
    nbOfNodes: 0,
    totalFootprint: 0,
    totalCrypto: 0,
    sealers: [],
    chainUpdateSubscription: null,
    blocks: []
})

const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const getters = {
    rewardsByBlock(state) {
        const rewards = state.blocks.map((d) => d.sealer.lastReward);
        rewards.unshift(0);
        return rewards;
    },
    averageReward(state) {
        if (state.blocks.length === 0) return 0;
        const rewards = state.blocks.map((d) => d.sealer.lastReward);
        return average(rewards);
    },
    averageDelaySec(state) {
        if (state.blocks.length < 2) return 0;
        const previousBlock = state.blocks[state.blocks.length - 2];
        const lastBlock = state.blocks[state.blocks.length - 1];
        return (lastBlock.receivedAt - previousBlock.receivedAt) / 1000;
    },
    lastBlock(state) {
        if (state.blocks.length === 0) return null;
        return state.blocks[state.blocks.length - 1];
    },
    lastBlockNumber(state, getters) {
        return getters.lastBlock?.block.number;
    }
}

const mutations = make.mutations(state);

async function processBlock(web3, block) {
    console.log("ProcessBloc", block.number);
    const intf = _intf($store.get("auth/provider"));
    const carbonFootprint = $store.get("auth/contract");

    const data = { block, sealer: undefined }
    try {
        if (typeof block.difficulty === "string" && !block.difficulty.startsWith('0x')) block.difficulty = Number.parseInt(block.difficulty);
        data.sealer = poaBlockHashToSealerInfo(block);
        const blockNumber = typeof block.number === "string" ? Number.parseInt(block.number) : block.number;
        data.block.number = blockNumber;
        const balance = web3.utils.toBN(await web3.eth.getBalance(data.sealer.address, blockNumber))
        // Total and delta
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
        data.receivedAt = Date.now();
    } catch (error) {
        console.warn("Error in preparing block", error)
    }
    return data;
}

const actions = {
    async fetchAllValues({ dispatch }) {
        await dispatch("fetchNumberOfNodes");
        await dispatch("fetchTotalFootprint");
        await dispatch("fetchNodeInformations");
    },

    async fetchNumberOfNodes() {
        const nbNodes = await readOnlyCall("nbNodes");
        $store.set("nodes/nbOfNodes", Number.parseInt(nbNodes));
    },

    async fetchTotalFootprint() {
        const totalFootprint = await readOnlyCall("totalFootprint");
        $store.set("nodes/totalFootprint", Number.parseInt(totalFootprint));
    },

    subscribeToChainUpdates({ state, rootState, dispatch }) {
        if (state.chainUpdateSubscription !== null) state.chainUpdateSubscription.unsubscribe();
        dispatch("fetchChainInformations");

        const web3 = new Web3(rootState.auth.provider);
        const subscription = web3.eth.subscribe("newBlockHeaders");
        subscription.on("data", (block) => dispatch("insertNewBlock", block));
        $store.set("nodes/chainUpdateSubscription", subscription);
    },

    unsubscribeToChainUpdates() {
        if (state.chainUpdateSubscription !== null) state.chainUpdateSubscription.unsubscribe();
    },

    async insertNewBlock({ state }, block) {
        const web3 = new Web3($store.get("auth/provider"));

        // Here process the new block, remove one if we've reached the cap
        let blocks = [...state.blocks];
        if (blocks.length >= MAX_BLOCKS_TO_KEEP) {
            blocks.shift();
        }
        blocks.push(await processBlock(web3, block));
        $store.set("nodes/blocks", blocks);
    },

    async fetchChainInformations({ rootState }) {
        console.log("fetchChainInformations called");
        const web3 = new Web3(rootState.auth.provider);
        // gets the eventually already available blocks to only request the new ones
        const blocks = [...(rootState.nodes.blocks||[])];
        const lastBlockInMemory = blocks.length>0 ? blocks[blocks.length-1].block.number : 0;
        const blockNumber = await web3.eth.getBlockNumber();
        this.blockNumber = blockNumber;

        let index = Math.max(lastBlockInMemory, blockNumber - MAX_BLOCKS_TO_KEEP);
        console.log("From block", index, "to", blockNumber);

        for (; index < blockNumber; index++) {
            const block = await web3.eth.getBlock(index, false);
            blocks.push(await processBlock(web3, block));
        }
        $store.set("nodes/blocks", blocks);
    },
    async fetchOneNodeInfo({rootState, dispatch}, address) {
        // ensure blocks are loaded, because it needs the blocks to find the node
        await dispatch("fetchNodeInformations");
        const sealers = rootState.nodes.sealers;
        let found = sealers.find(s=>s.address == address.toLowerCase());
        return found? {...found}: found;
    },
    async fetchNodeInformations({ rootState, dispatch }) {
        console.log("fetchNodeInformations called");
        await dispatch("fetchChainInformations");
        // const web3 = new Web3(rootState.auth.provider);
        // const blockNumber = await web3.eth.getBlockNumber();
        const blocks = [...rootState.nodes.blocks];
        const sealers = {};
        const seenSealers = {};

        let i = 0;
        let maxSealerSeenCounter = 0;
        while (maxSealerSeenCounter <= 2) { // makes at least 2 full loops of PoA signature
            // const index = blockNumber - i;
            // const block = await web3.eth.getBlock(index, false);
            const data = blocks.pop(); // await processBlock(web3, block);
            if (!data) return;
            console.log("block", data.block.number, "sealer", data.sealer);

            if (i === 0) {
                console.log("data", data);
                $store.set("nodes/totalCrypto", data.totalCrypto);
            }

            const address = data.sealer.address;
            if (!sealers[address]) {
                sealers[address] = data.sealer;
            }
            seenSealers[address] = (seenSealers[address] ?? 0) + 1;

            // capture the max of the node seen
            maxSealerSeenCounter = Math.max(maxSealerSeenCounter, seenSealers[address]);
            i++;
        }
        const sortedSealers = Object.values(sealers).sort((a, b) => a.footprint < b.footprint);
        // console.log(sortedSealers.map(s => s.footprint));
        $store.set("nodes/sealers", sortedSealers);
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
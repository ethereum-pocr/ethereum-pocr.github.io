import { make } from "vuex-pathify";
import { poaBlockHashToSealerInfo } from "pocr-utils";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import { readOnlyCall, intf as _intf, writeCall, handleMMResponse, getWalletBalance, subscribeNewBlocks } from "@/lib/api";
import { totalCRCAddress, GeneratedCRCTotalHash } from "@/lib/const";
import $store from "@/store/index";

const MAX_BLOCKS_TO_KEEP = 10;

const state = () => ({
    nbOfNodes: 0,
    totalFootprint: 0,
    totalCrypto: 0,
    sealers: [],
    chainUpdateSubscription: null,
    blocks: [],
    currentBlockNumber: 0,
    currentWalletBalanceWei: 0,
    backupLoop: null,
    timeSinceLastBlock: 0
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
        const minIndex = state.blocks.length-Math.min(state.blocks.length, 11)
        const delays = [];
        for (let i=state.blocks.length-1; i>minIndex; i--) {
            const previousBlock = state.blocks[i - 1];
            const lastBlock = state.blocks[i];
            delays.push((lastBlock.receivedAt - previousBlock.receivedAt) / 1000)
        }
        // console.log("Debug averageDelaySec", minIndex, state.blocks.length, delays);
        if (delays.length == 0) return 0;
        return delays.reduce( (sum, v)=>v+sum, 0) / delays.length;
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

async function updateSealerDetails(web3, sealer) {
    const carbonFootprint = $store.get("auth/contract");
    const intf = _intf(web3);
    const balance = web3.utils.toBN(await web3.eth.getBalance(sealer.address));
    const bal = Number.parseFloat(web3.utils.fromWei(balance, "ether"));
    const footprint = await carbonFootprint.footprint(intf.call(), sealer.address);
    sealer.footprint = Number.parseFloat(footprint);
    sealer.balance = bal;
    sealer.lastReward = 0; //delta //normalRewardForFootprint(data.sealer.footprint, data.totalFootprint, data.nbNodes);

    return sealer;
}

async function processBlock(web3, block) {
    console.log("ProcessBloc", block.number, new Date().toTimeString());
    const intf = _intf($store.get("auth/provider"));
    const carbonFootprint = $store.get("auth/contract");

    const data = { block, sealer: undefined }
    try {
        if (typeof block.difficulty === "string" && !block.difficulty.startsWith('0x')) block.difficulty = Number.parseInt(block.difficulty);
        const blockNumber = typeof block.number === "string" ? Number.parseInt(block.number) : block.number;
        // Total and delta
        let totalCryptoB4 = web3.utils.toBN(0);
        let totalCrypto = web3.utils.toBN(0);
        try {
            totalCryptoB4 = web3.utils.toBN(await web3.eth.getStorageAt(totalCRCAddress, GeneratedCRCTotalHash, blockNumber -1))
            totalCrypto = web3.utils.toBN(await web3.eth.getStorageAt(totalCRCAddress, GeneratedCRCTotalHash, blockNumber))
        } catch (error) {
            // can typically fails when the blockNumber is 128 block before the last block because of missing trie node
            // In that case we ignore the calculation (zero)
        }
        // extract the sealer data
        data.sealer = poaBlockHashToSealerInfo(block);
        data.sealer = await updateSealerDetails(web3, data.sealer);
        const delta = Number.parseFloat(web3.utils.fromWei(totalCrypto.sub(totalCryptoB4), "ether"));
        data.sealer.lastReward = delta;
        data.block.number = blockNumber;

        const totalFootprint = await carbonFootprint.totalFootprint(intf.call())
        const nbNodes = await carbonFootprint.nbNodes(intf.call())

        data.totalFootprint = Number.parseInt(totalFootprint)
        data.totalCrypto = Number.parseFloat(web3.utils.fromWei(totalCrypto, "ether"))
        data.nbNodes = Number.parseInt(nbNodes)
        data.receivedAt = Date.now();

        // read the sealers from the contract
        const sealers = []
        for (let index = 0; index < nbNodes; index++) {
            const sealer = await carbonFootprint.sealers(intf.call(), index)
            const isSealer = await carbonFootprint.isSealer(intf.call(), sealer)
            sealers.push({sealer, isSealer})
        }
        // console.log("Loaded sealers", sealers);

    } catch (error) {
        console.warn("Error in preparing block", error)
        throw new Error("Fail processing block "+block.number)
    }
    return data;
}
async function logicOnNewBloc(web3, blocks, sealers, block) {
    // we have a block that is before the current block, remove the block up to that block
    while (blocks.length>0 && blocks[blocks.length-1].block.number >= block.number) {
        blocks.pop();
    }
    const data = await processBlock(web3, block);
    blocks.push(data);
    while (blocks.length >= MAX_BLOCKS_TO_KEEP) {
        blocks.shift();
    }

    // Update the sealer of the block
    let si = sealers.findIndex(s=>s.address == data.sealer.address);
    if (si<0) { // not found
        const sealer = {...data.sealer,sealedBlocks: 1}
        console.log("Creating new sealer", sealer);
        sealers.push(sealer);
    } else {
        const sealer = {...sealers[si], ...data.sealer};
        sealer.sealedBlocks ++;
        sealers[si] = sealer;
    }
    return {blocks, sealers};

}

const actions = {
    async fetchAllValues({ dispatch }) {
        await dispatch("fetchNumberOfNodes");
        await dispatch("fetchTotalFootprint");
        await dispatch("updateNodesStatus");
    },

    async initBackupLoop({state, commit}) {
        if (state.backupLoop) {clearInterval(this.backupLoop)}
        commit("timeSinceLastBlock", 0)
        const backupLoop = setInterval( ()=>{
            const lastBlock = $store.get("nodes/lastBlock");
            if (!lastBlock) return;
            const timeSinceLastBlock = Date.now()-lastBlock.receivedAt;
            // if (timeSinceLastBlock > 60*1000) {
            //     console.warn("No block update since more than 60 seconds. Force a subscription");
            //     window.location.reload();
            //     // dispatch("subscribeToChainUpdates")
            // }
            commit("timeSinceLastBlock", timeSinceLastBlock)
        }, 200);

        commit("backupLoop", backupLoop);
    },

    async fetchNumberOfNodes() {
        const nbNodes = await readOnlyCall("nbNodes");
        $store.set("nodes/nbOfNodes", Number.parseInt(nbNodes));
    },

    async fetchTotalFootprint() {
        const totalFootprint = await readOnlyCall("totalFootprint");
        $store.set("nodes/totalFootprint", Number.parseInt(totalFootprint));
    },

    async updateNodesStatus() {
        const sealers = $store.get("nodes/sealers")
        for (const sealer of sealers) {
            const s = await readOnlyCall("isSealer", sealer.address)
            // console.log("isSealer", sealer);
            sealer.isActive = s
        }
        $store.set("nodes/sealers", sealers)
    },

    async subscribeToChainUpdates({ state, rootState, dispatch }) {
        if (state.chainUpdateSubscription !== null) {
            state.chainUpdateSubscription.unsubscribe();
            $store.set("nodes/chainUpdateSubscription", null);
        }
        await dispatch("fetchChainInformations");

        const web3 = rootState.auth.web3;
        const subscription = subscribeNewBlocks(web3) //web3.eth.subscribe("newBlockHeaders");
        let blockProcessing = false;
        let blocksWaiting = [];
        const processingFunc = async (block) => {
            try {
                if (block.baseFeePerGas == undefined) block = await web3.eth.getBlock(block.number);
                await dispatch("insertNewBlock", block);
            } catch (error) {
                // some error on the subscription processing
                // if the error is due to the loss of connection it needs a reset of the connection
                console.warn("Error on receiving a new block", error);
                blocksWaiting = []; // clear
                await dispatch("subscribeToChainUpdates");
            }
        }
        subscription.on("data", async block =>{
            if (blockProcessing) blocksWaiting.push(block);
            else try {
                blockProcessing = true;
                await processingFunc(block);
                while( (block = blocksWaiting.shift()) ) {
                    await processingFunc(block);
                }
            } finally {
                blockProcessing = false;
            }
        });
        $store.set("nodes/chainUpdateSubscription", subscription);
    },

    unsubscribeToChainUpdates() {
        if (state.chainUpdateSubscription !== null) state.chainUpdateSubscription.unsubscribe();
    },



    async insertNewBlock({ state, rootState, commit, dispatch }, block) {
        const web3 = $store.get("auth/web3");
        commit("currentBlockNumber", block.number);
        if (rootState.auth.wallet) {
            const bal = await getWalletBalance(rootState.auth.wallet);
            commit("currentWalletBalanceWei", bal);
        }
        try {
            const {blocks, sealers} = await logicOnNewBloc(web3, [...state.blocks], [...state.sealers], block);
            
            $store.set("nodes/blocks", blocks);
            $store.set("nodes/sealers", sealers);
            if (blocks.length>0) {
                $store.set("nodes/totalCrypto", blocks[blocks.length-1].totalCrypto)
            }
        } catch (error) {
            // ignore that block
        }
        dispatch("fetchAllValues");
    },

    discoverNotRunningSealers({rootState, state}) {
        const web3 = rootState.auth.web3;
        const contract = rootState.auth.contract;
        const prov = new Web3FunctionProvider(rootState.auth.provider, ()=>Promise.resolve(contract.deployedAt));
        const sealers = [...state.sealers]; // make a copy of the sealers from the store
        contract.events.CarbonFootprintUpdate(prov.get({fromBlock: 1}), {})
        .on("log", async log=>{
            // try to find the sealer in the list
            let found = sealers.find(s=>s.address.toLowerCase() == log.returnValues.node.toLowerCase())
            if (!found) {
                const sealer = await updateSealerDetails(web3, {
                    address: log.returnValues.node.toLowerCase(), 
                    vanity: {custom:"Unknown innactive node"},
                    sealedBlocks: 0
                })
                // check again if it not already added, as the above can execute concurrently
                found = sealers.find(s=>s.address.toLowerCase() == sealer.address)
                // we have collected the node data, but maybe it is not a node anymore
                if (sealer.footprint>0 && found===undefined) {
                    console.log("Adding an innactive sealer", sealer);
                    // keep in the local array variable 
                    sealers.push(sealer);
                    // but also update the store with some delay to prevent concurrent race in other state setter
                    setTimeout( ()=>$store.set("nodes/sealers", sealers), 200);
                }
            }
        })
    },

    async fetchChainInformations({ rootState, dispatch }) {
        const web3 = rootState.auth.web3;
        // gets the eventually already available blocks to only request the new ones
        let blocks = [...(rootState.nodes.blocks||[])];
        // the sealers array or create it
        let sealers = [...(rootState.nodes.sealers||[])];
        const lastBlockInMemory = blocks.length>0 ? blocks[blocks.length-1].block.number : 0;
        const blockNumber = await web3.eth.getBlockNumber();
        this.blockNumber = blockNumber;

        let index = Math.max(lastBlockInMemory+1, blockNumber - MAX_BLOCKS_TO_KEEP);
        console.log("From block", index, "to", blockNumber, "sealers count", sealers.length, "blocks count", blocks.length);

        const blockNumbers = [];
        for (; index < blockNumber; index++) blockNumbers.push(index);
        const loadedBlocks = await Promise.all(blockNumbers.map(index=>web3.eth.getBlock(index, false)));
        for (const block of loadedBlocks) {
            // const block = await web3.eth.getBlock(index, false);
            try {
                const r = await logicOnNewBloc(web3, blocks, sealers, block);
                blocks = r.blocks;
                sealers = r.sealers;
            } catch (error) {
                // ignore block                
            }
        }
        if (blocks.length>0) {
            $store.set("nodes/totalCrypto", blocks[blocks.length-1].totalCrypto)
        }
        $store.set("nodes/blocks", blocks);
        $store.set("nodes/sealers", sealers);
        // We may have nodes that have been receiving a footprint that are not running, let's find them from the event log
        dispatch("discoverNotRunningSealers");
        $store.dispatch("auth/fetchRole");
    },
    async fetchOneNodeInfo({rootState}, address) {
        const web3 = rootState.auth.web3;
        // ensure blocks are loaded, because it needs the blocks to find the node
        const sealers = rootState.nodes.sealers || [];
        let found = sealers.findIndex(s=>s.address == address.toLowerCase());
        if (found>=0) {
            sealers[found] = await updateSealerDetails(web3, sealers[found]);
            $store.set("nodes/sealers", sealers);
            return sealers[found];
        } else {
            return undefined; //await updateSealerDetails(web3, {address})
        }
    },

    async updateFootprint({dispatch}, { sealerAddress, footprint }) {
        await handleMMResponse(writeCall("setFootprint", sealerAddress, footprint));
        dispatch("fetchOneNodeInfo", sealerAddress);
        dispatch("fetchAllValues")
    }
}

export default {
    state,
    getters,
    mutations,
    actions,
    namespaced: true
}
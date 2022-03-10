<template>
  <v-container>
    <v-layout row wrap>
      <v-row>
        <v-col cols="4">
          <v-card elevation="3" height="200" class="ma-6">
            <v-card-subtitle>Block</v-card-subtitle>
            <v-card-title class="align-center">
              <span class="text-h3 ma-auto">{{ blockNumber }}</span>
            </v-card-title>
            <v-card-subtitle>{{averageDelaySec.toFixed(2)}} sec</v-card-subtitle>
            <v-card-subtitle>Total CTC: {{totalCrypto.toFixed(4)}}</v-card-subtitle>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card elevation="3" height="200" width="200" class="ma-6">
            <v-card-subtitle>Nodes</v-card-subtitle>
            <v-card-title class="align-center">
              <span class="text-h2 ma-auto">{{ nbNodes }}</span>
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card elevation="3" height="200" width="200" class="ma-6">
            <v-card-subtitle>Total footprint</v-card-subtitle>
            <v-card-title class="align-center">
              <span class="text-h2 ma-auto">{{ totalFootprint }}</span>
            </v-card-title>
            <v-card-subtitle>Average: {{(totalFootprint/nbNodes).toFixed(2)}}</v-card-subtitle>
          </v-card>
        </v-col>
        <v-col cols="12" class="pa-8">
          <v-card-title>Footprint for each of the nodes</v-card-title>
          <v-card-subtitle>
            Last block sealer: {{blocks[blocks.length-1].sealer.address}} / 
            {{blocks[blocks.length-1].sealer.vanity.custom}}.
            Footprint: {{blocks[blocks.length-1].sealer.footprint}}
          </v-card-subtitle>
          <v-sparkline
            auto-draw
            type="bar"
            :auto-draw-duration="500"
            auto-line-width
            :value="sealersFootprint"
            
            label-size="3"
            :gradient="['#f72047', '#ffd200', '#1feaea']"
            padding="8"
          >
            <template v-slot:label="item">
              {{sealersLabels[item.index]}} - 
              {{item.value}}
          </template>
          
          </v-sparkline>
        </v-col>
        <v-col cols="12" class="pa-8">
          <v-card-title>Block reward per node</v-card-title>
          <v-card-subtitle>
            Last block sealer: {{blocks[blocks.length-1].sealer.address}} / 
            {{blocks[blocks.length-1].sealer.vanity.custom}}.
            Footprint: {{blocks[blocks.length-1].sealer.footprint}}
          </v-card-subtitle>
          <v-sparkline
            auto-draw
            type="bar"
            :auto-draw-duration="500"
            auto-line-width
            :value="sealersReward"
            label-size="3"
            :gradient="['#42b3f4']"
            :padding="28"
          >
          <template v-slot:label="item">
            {{blocks[blocks.length-1].sealer.address==sealersAddress[item.index]?'[':''}}
              {{sealersAddress[item.index]}} 
            {{blocks[blocks.length-1].sealer.address==sealersAddress[item.index]?']':''}}  
              - 
              {{Number.parseFloat(item.value).toFixed(2)}}
          </template>
          </v-sparkline>
        </v-col>

        <v-col cols="12" class="pa-8">
          <v-card-title>CTC Creation by block </v-card-title>
          <v-card-subtitle>Last reward: {{rewardsByBlock[rewardsByBlock.length-1].toFixed(4)}} CTC; Average: {{averageReward.toFixed(4)}} CTC; Last {{rewardsByBlock.length-1}} blocks</v-card-subtitle>
          <v-sparkline
            auto-draw
            type="trend"
            :auto-draw-duration="0"
            :line-width="0.3"
            :value="rewardsByBlock"
            label-size="3"
            :gradient="['#42b3f4']"
          ></v-sparkline>
        </v-col>
      </v-row>
    </v-layout>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import { blockRange, currentBlockNumber, onNewBlock } from "../lib/api";
const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
export default {
  data: () => {
    return {
      nbBlocksToKeep: 100,
      sealerMap: new Map(),
      blocks: [],
      totalFootprint: 0,
      totalCrypto: 0,
      nbNodes: 0,
      blockNumber: 0,
      sealersLabels: [],
      sealersAddress: [],
      sealersFootprint: [],
      sealersReward: [],
    };
  },
  async mounted() {
    const blockNumber = await currentBlockNumber();
    this.blockNumber = blockNumber;
    await blockRange(blockNumber - this.nbBlocksToKeep, blockNumber, this.processBlockData);
    onNewBlock(this.processBlockData);
  },
  computed: {
    rewardsByBlock() {
      const rewards = this.blocks.map(d=>d.sealer.lastReward);
      rewards.unshift(0);
      return rewards;
    },
    averageReward() {
      const rewards = this.blocks.map(d=>d.sealer.lastReward);
      return average(rewards);
    },
    averageDelaySec() {
      if (this.blocks.length<2) return 0;
      const previousBlock = this.blocks[this.blocks.length-2];
      const lastBlock = this.blocks[this.blocks.length-1];
      return (lastBlock.receivedAt - previousBlock.receivedAt) / 1000
    }
  },
  methods: {
    ...mapActions(["goToPage"]),
    processBlockData(data) {
      // console.log(data);

      let blocks = this.blocks.filter(d=>d.block.number>data.block.number-this.nbBlocksToKeep && d.block.number!=data.block.number);
      blocks = blocks.sort((d1, d2)=>d1.block.number - d2.block.number);
      blocks.push(data);
      this.blocks = blocks;

      const sealerInfo = {
        address: data.sealer.address,
        info: data.sealer.vanity.custom,
        footprint: data.sealer.footprint,
        balance: data.sealer.balance,
        reward: data.sealer.lastReward,
      };
      this.sealerMap.set(sealerInfo.address, sealerInfo);
      this.totalFootprint = data.totalFootprint;
      this.totalCrypto = data.totalCrypto;
      this.nbNodes = data.nbNodes;
      this.blockNumber = data.block.number;
      this.updateSealersArrays();
    },
    updateSealersArrays() {
      let sealers = [];
      for (const k of this.sealerMap.keys()) {
        const info = this.sealerMap.get(k);
        sealers.push(info);
      }
      sealers = sealers.sort((i1, i2) => i1.footprint - i2.footprint);

      this.sealersLabels = sealers.map((info) => info.info);
      this.sealersAddress = sealers.map((info) => info.address);
      this.sealersFootprint = sealers.map((info) => info.footprint);
      this.sealersReward = sealers.map((info) => info.reward);
    },
  },
};
</script>

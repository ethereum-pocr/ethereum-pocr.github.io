<template>
  <v-layout row wrap>
    <v-row>
      <v-col cols="4">
        <v-card height="200" width="200" class="ma-6">
          <v-card-subtitle>Block</v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h3 ma-auto">{{
              lastBlock && lastBlock.block.number
            }}</span>
          </v-card-title>
          <v-card-subtitle
            >{{ averageDelaySec.toFixed(2) }} sec</v-card-subtitle
          >
          <v-card-subtitle
            >Total CTC: {{ totalCrypto.toFixed(4) }}</v-card-subtitle
          >
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card height="200" width="200" class="ma-6">
          <v-card-subtitle>Nodes</v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h2 ma-auto">{{ nbOfNodes }}</span>
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card height="200" width="200" class="ma-6">
          <v-card-subtitle>Total footprint</v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h2 ma-auto">{{ totalFootprint }}</span>
          </v-card-title>
          <v-card-subtitle
            >Average:
            {{ (totalFootprint / nbOfNodes).toFixed(2) }}</v-card-subtitle
          >
        </v-card>
      </v-col>
      <v-col cols="12" class="pa-8" v-if="lastBlock">
        <v-card-title>Footprint for each of the nodes</v-card-title>
        <v-card-subtitle>
          Last block sealer: {{ lastBlock.sealer.address }} /
          {{ lastBlock.sealer.vanity.custom }}. Footprint:
          {{ lastBlock.sealer.footprint }}
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
            {{ sealersLabels[item.index] }} -
            {{ item.value }}
          </template>
        </v-sparkline>
      </v-col>
      <v-col cols="12" class="pa-8" v-if="lastBlock">
        <v-card-title>Block reward per node</v-card-title>
        <v-card-subtitle>
          Last block sealer: {{ lastBlock.sealer.address }} /
          {{ lastBlock.sealer.vanity.custom }}. Footprint:
          {{ lastBlock.sealer.footprint }}
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
            {{
              lastBlock.sealer.address == sealersAddress[item.index] ? "[" : ""
            }}
            {{ sealersAddress[item.index] }}
            {{
              lastBlock.sealer.address == sealersAddress[item.index] ? "]" : ""
            }}
            -
            {{ Number.parseFloat(item.value).toFixed(2) }}
          </template>
        </v-sparkline>
      </v-col>

      <v-col cols="12" class="pa-8">
        <v-card-title>CTC Creation by block </v-card-title>
        <v-card-subtitle
          >Last reward:
          {{ rewardsByBlock[rewardsByBlock.length - 1].toFixed(4) }} CTC;
          Average: {{ averageReward.toFixed(4) }} CTC; Last
          {{ rewardsByBlock.length - 1 }} blocks</v-card-subtitle
        >
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
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  data: () => {
    return {
      nbBlocksToKeep: 100,
      sealerMap: new Map(),
      blocks: [],
      //   blockNumber: 0,
      //   sealersLabels: [],
      //   sealersAddress: [],
      //   sealersFootprint: [],
      sealersReward: [],
    };
  },
  async mounted() {
    await this.fetchChainInformations()
    await this.fetchAllValues();
    await this.subscribeToChainUpdates();
  },
  computed: {
    ...get("nodes", [
      "sealers",
      "nbOfNodes",
      "lastBlock",
      "totalFootprint",
      "totalCrypto",
      "rewardsByBlock",
      "averageReward",
      "averageDelaySec",
      "lastBlock",
    ]),
    sealersFootprint() {
      return this.sealers.map((s) => s.footprint);
    },
    sealersAddress() {
      return this.sealers.map((s) => s.address);
    },
    sealersLabels() {
      return this.sealers.map((s) => s.vanity.custom);
    },
  },
  methods: {
    ...call("nodes", [
      "fetchAllValues",
      "fetchChainInformations",
      "subscribeToChainUpdates",
    ]),
    // ...mapActions(["goToPage"]),
    processBlockData(data) {
      // console.log(data);

      let blocks = this.blocks.filter(
        (d) =>
          d.block.number > data.block.number - this.nbBlocksToKeep &&
          d.block.number != data.block.number
      );
      blocks = blocks.sort((d1, d2) => d1.block.number - d2.block.number);
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
      this.nbOfNodes = data.nbOfNodes;
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

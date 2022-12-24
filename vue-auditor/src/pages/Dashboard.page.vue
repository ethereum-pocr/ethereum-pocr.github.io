<template>
  <v-layout row wrap>
    <v-row>
      <v-col cols="4">
        <v-card height="200" width="300" class="my-6 ma-auto">
          <v-card-subtitle>Block <explorer type="block" :id="lastBlock?lastBlock.block.number:0"></explorer></v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h4 ma-auto" :style="lastBlockNoTurnSealing?'color:red':''">{{
              lastBlock && lastBlock.block.number
            }}</span>
          </v-card-title>
          <v-card-subtitle>Total of {{ totalCrypto.toFixed(2) }} ₡ created</v-card-subtitle>
          <v-card-subtitle>{{ (timeSinceLastBlock/1000).toFixed(2) }} sec. since last update</v-card-subtitle>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card height="200" width="200" class="my-6 ma-auto">
          <v-card-subtitle>Audited nodes</v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h2 ma-auto">{{ nbOfNodes }}</span>
          </v-card-title>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-card height="200" width="300" class="my-6 ma-auto">
          <v-card-subtitle>Total footprint (g.CO₂ E)</v-card-subtitle>
          <v-card-title class="align-center">
            <span class="text-h4 ma-auto">{{ totalFootprint }}</span>
          </v-card-title>
          <v-card-subtitle class="mt-3"
            >Average:
            {{ (totalFootprint / nbOfNodes).toFixed(2) }} g.CO₂ E per node</v-card-subtitle
          >
        </v-card>
      </v-col>
      <v-col cols="12" class="py-8" v-if="lastBlock">
        <v-card>
        <v-card-title>Carbon Footprint for each of the nodes</v-card-title>
        <v-card-subtitle>
          Last block sealer: {{ lastBlock.sealer.address }} /
          {{ lastBlock.sealer.vanity.custom }}. Footprint:
          {{ lastBlock.sealer.footprint }} g.CO₂
        </v-card-subtitle>
        <v-card-text>
          <v-progress-linear v-for="sealer of sealersSorted" :key="sealer.address" 
            height="2em" class="my-1"
            :value="sealer.footprint / maxFootprint * 100"
            :color="gradientGreenToRed(sealer.footprint / maxFootprint)"
          >
            <template v-slot:default="{  }">
              {{sealer.vanity.custom}} - <strong>{{ sealer.footprint }}</strong>  g.CO₂
            </template>
          </v-progress-linear>
        </v-card-text>
        <!-- <v-sparkline
          auto-draw
          type="bar"
          
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
        </v-sparkline> -->
        </v-card>
      </v-col>

      <v-col cols="12" class="pb-8" v-if="lastBlock">
        <v-card>
          <v-card-title>Sealers</v-card-title>
          <v-card-text>
            <v-data-table
              :items="sealers"
              :headers="sealersHeaders"
              :items-per-page="-1"
              hide-default-footer
            >
              <template v-slot:item.name="{ item }">
                <div><v-icon>{{item.isActive?"mdi-lock-open-check-outline":"mdi-lock-remove"}}</v-icon> {{ item.vanity.custom }}</div>
                <div>{{ item.address }}</div>
              </template>
              <template v-slot:item.ratio="{ item }">
                <div>{{ (100 * item.sealedBlocks / totalSealedBlocks).toFixed(2) }} %</div>
                <div>{{ item.sealedBlocks }} / {{ totalSealedBlocks }}</div>
              </template>
              <template v-slot:item.balance="{ item }">
                <div>{{ item.balance.toFixed(4) }}</div>
              </template>
              <template v-slot:item.lastReward="{ item }">
                <div>{{ item.lastReward.toFixed(4) }}</div>
              </template>
              <template v-slot:item.lastSealer="{ item }">
                <v-icon v-if="item.address==lastBlock.sealer.address">mdi-seal</v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
<!-- 
      <v-col cols="12" class="pa-8" v-if="lastBlock">
        <v-card-title>Block reward per node</v-card-title>
        <v-card-subtitle>
          Last block sealer: {{ lastBlock.sealer.address }} /
          {{ lastBlock.sealer.vanity.custom }}. Footprint:
          {{ lastBlock.sealer.footprint }} g.CO₂
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
      </v-col> -->

      <!-- <v-col cols="12" class="pa-8">
        <v-card-title>CRC Creation by block </v-card-title>
        <v-card-subtitle
          >Last reward:
          {{ rewardsByBlock[rewardsByBlock.length - 1].toFixed(4) }} CRC;
          Average: {{ averageReward.toFixed(4) }} CRC; Last
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
      </v-col> -->
    </v-row>
  </v-layout>
</template>

<script>
import { get, call } from "vuex-pathify";
import { handleMM } from '../lib/api';
import { gradientGreenToRed } from '../lib/colors'
import Explorer from "../components/ExplorerRedirect.vue";

export default {
  components: {Explorer},
  data: () => {
    return {
      timerLoop: null,
      timeSinceLastBlock: 0,
      nbBlocksToKeep: 100,
      sealerMap: new Map(),
      blocks: [],
      sealersReward: [],
      sealersHeaders: [
      { text: "Name", value: "name" },
      { text: "Footprint (g.CO₂)", value: "footprint" },
      { text: "Reward (₡)", value: "lastReward" },
      { text: "Balance (₡)", value: "balance" },
      { text: "Sealing ratio", value: "ratio" },
      { text: "Last", value: "lastSealer" },
    ],
    };
  },
  async mounted() {
    await handleMM(this.fetchChainInformations)
    // await this.fetchChainInformations()
    await this.fetchAllValues();
    await this.subscribeToChainUpdates();

    if (this.timerLoop) {clearInterval(this.timerLoop)}
    this.timerLoop = setInterval( ()=>{
      if (!this.lastBlock) return;
      this.timeSinceLastBlock = Date.now()-this.lastBlock.receivedAt;
      if (this.timeSinceLastBlock > 60*1000) {
        window.location.reload()
      }
    }, 200);
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
    ]),
    sealersSorted() {
      return [...this.sealers].sort( (a,b)=>a.footprint-b.footprint )
    },
    maxFootprint() {
      return this.sealers.reduce( (max, s)=>s.footprint>max?s.footprint:max, 1 )
    },
    sealersFootprint() {
      return this.sealers.map((s) => s.footprint);
    },
    sealersAddress() {
      return this.sealers.map((s) => s.address);
    },
    sealersLabels() {
      return this.sealers.map((s) => s.vanity.custom);
    },
    totalSealedBlocks() {
      return this.sealers.reduce( (total, s)=>total+s.sealedBlocks, 0);
    },
    lastBlockNoTurnSealing() {
      return this.lastBlock && this.lastBlock.block.difficulty==1; // 1 means out of turn ; 2 means in turn
    },
  },
  methods: {
    gradientGreenToRed,
    ...call("nodes", [
      "fetchAllValues",
      "fetchChainInformations",
      "subscribeToChainUpdates",
    ]),
    // ...mapActions(["goToPage"]),
    // processBlockData(data) {
    //   // console.log(data);

    //   let blocks = this.blocks.filter(
    //     (d) =>
    //       d.block.number > data.block.number - this.nbBlocksToKeep &&
    //       d.block.number != data.block.number
    //   );
    //   blocks = blocks.sort((d1, d2) => d1.block.number - d2.block.number);
    //   blocks.push(data);
    //   this.blocks = blocks;

    //   const sealerInfo = {
    //     address: data.sealer.address,
    //     info: data.sealer.vanity.custom,
    //     footprint: data.sealer.footprint,
    //     balance: data.sealer.balance,
    //     reward: data.sealer.lastReward,
    //   };
    //   this.sealerMap.set(sealerInfo.address, sealerInfo);
    //   this.totalFootprint = data.totalFootprint;
    //   this.totalCrypto = data.totalCrypto;
    //   this.nbOfNodes = data.nbOfNodes;
    //   this.blockNumber = data.block.number;
    //   this.updateSealersArrays();
    // },
    // updateSealersArrays() {
    //   let sealers = [];
    //   for (const k of this.sealerMap.keys()) {
    //     const info = this.sealerMap.get(k);
    //     sealers.push(info);
    //   }
    //   sealers = sealers.sort((i1, i2) => i1.footprint - i2.footprint);

    //   this.sealersLabels = sealers.map((info) => info.info);
    //   this.sealersAddress = sealers.map((info) => info.address);
    //   this.sealersFootprint = sealers.map((info) => info.footprint);
    //   this.sealersReward = sealers.map((info) => info.reward);
    // },
  },
};
</script>

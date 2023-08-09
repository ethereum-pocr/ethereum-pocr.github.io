<template>
  <v-layout col wrap>
    <v-card height="200" width="300" class="my-6 ma-auto">
      <v-card-subtitle>Block <explorer type="block" :id="lastBlock?lastBlock.block.number:0"></explorer></v-card-subtitle>
      <v-card-title class="align-center">
        <span class="text-h4 ma-auto" :style="lastBlockNoTurnSealing?'color:red':''">{{
          lastBlock && to1000s(lastBlock.block.number)
        }}</span>
      </v-card-title>
      <v-card-subtitle>Total of {{ to1000s(totalCrypto,2) }} ₡ created</v-card-subtitle>
      <v-card-subtitle>{{ (timeSinceLastBlock/1000).toFixed(2) }} sec. since last update</v-card-subtitle>
    </v-card>

    <v-card height="200" width="200" class="my-6 ma-auto">
      <v-card-subtitle>Audited nodes</v-card-subtitle>
      <v-card-title class="align-center">
        <span class="text-h2 ma-auto">{{ nbOfNodes }}</span>
      </v-card-title>
    </v-card>
    <v-card height="200" width="300" class="my-6 ma-auto">
      <v-card-subtitle>Total environmental footprint (EF)</v-card-subtitle>
      <v-card-title class="align-center">
        <span class="text-h4 ma-auto"><climate-indicator :value="totalFootprint"></climate-indicator></span>
      </v-card-title>
      <v-card-subtitle class="mt-3"
        >Average: <climate-indicator :value="avgFootprint"></climate-indicator> EF
      </v-card-subtitle
      >
    </v-card>
    <v-row>
      <v-col cols="12" class="py-8" v-if="lastBlock">
        <v-card>
        <v-card-title>Environmental Footprint of the sealers</v-card-title>
        <v-card-subtitle>
          Last block sealer: {{ lastBlock.sealer.address }} /
          {{ lastBlock.sealer.vanity.custom }}. Footprint: <climate-indicator :value="lastBlock.sealer.footprint"></climate-indicator> EF
        </v-card-subtitle>
        <v-card-text>
          <v-progress-linear v-for="sealer of sealersSorted" :key="sealer.address" 
            height="2em" class="my-1"
            :value="(sealer.footprint-minFootprint) / (maxFootprint-minFootprint) * 100"
            :color="gradientGreenToRed((sealer.footprint-minFootprint) / (maxFootprint-minFootprint))"
          >
            <template v-slot:default="{  }">
              {{sealer.vanity.custom}} -  &nbsp; <strong><climate-indicator :value="sealer.footprint"></climate-indicator> </strong> &nbsp; EF
            </template>
          </v-progress-linear>
        </v-card-text>

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
              <template v-slot:item.footprint="{ item }">
                <div v-if="item.footprint==0" class="text-caption">Pending audit</div>
                <climate-indicator v-else :value="item.footprint"></climate-indicator>
              </template>
              <template v-slot:item.ratio="{ item }">
                <div>{{ (100 * item.sealedBlocks / totalSealedBlocks).toFixed(2) }} %</div>
                <div>{{ item.sealedBlocks }} / {{ totalSealedBlocks }}</div>
              </template>
              <template v-slot:item.balance="{ item }">
                <div>{{ to1000s(item.balance, 4) }}</div>
              </template>
              <template v-slot:item.lastReward="{ item }">
                <div>{{ to1000s(item.lastReward,4) }}</div>
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
// import { handleMM } from '../lib/api';
import { gradientGreenToRed } from '../lib/colors'
import { to1000s } from '../lib/numbers'
import Explorer from "../components/ExplorerRedirect.vue";
import ClimateIndicator from "../components/ClimateIndicator.vue";

export default {
  components: {Explorer, ClimateIndicator},
  data: () => {
    return {
      nbBlocksToKeep: 100,
      sealerMap: new Map(),
      blocks: [],
      sealersReward: [],
      sealersHeaders: [
      { text: "Name", value: "name", align:"left" },
      { text: "Env. Footprint", value: "footprint" , align:"right"},
      { text: "Reward (₡)", value: "lastReward" , align:"right"},
      { text: "Balance (₡)", value: "balance" , align:"right"},
      { text: "Sealing ratio", value: "ratio", align:"center"},
      { text: "Last", value: "lastSealer" },
    ],
    };
  },
  async mounted() {
    console.log("Dashboard mounted");
    try {
      await this.fetchAllValues();
      await this.fetchChainInformations();
      await this.subscribeToChainUpdates();
      await this.initBackupLoop();
    } catch (error) {
      console.error("Fail loading dashboard", error);      
    }

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
      "timeSinceLastBlock"
    ]),
    sealersSorted() {
      return [...this.sealers].filter(s=>s.footprint>0).sort( (a,b)=>a.footprint-b.footprint )
    },
    maxFootprint() {
      return this.sealers.reduce( (max, s)=>s.footprint>max?s.footprint:max, 1 )
    },
    minFootprint() {
      const max = this.maxFootprint;
      const min = this.sealers.reduce( (min, s)=>s.footprint<min?s.footprint:min, max );
      const delta = max-min;
      return min - delta*0.05 ; // remove 5% to have a lower min
    },
    avgFootprint() {
      const {nb, total} = this.sealers.reduce( ({nb, total}, s)=>s.footprint>0?({nb:nb+1, total: total+s.footprint}):{nb,total}, {nb:0, total:0} );
      if (nb>0) return total / nb;
      return 0;
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
    gradientGreenToRed, to1000s,
    ...call("nodes", [
      "fetchAllValues",
      "fetchChainInformations",
      "subscribeToChainUpdates",
      "initBackupLoop"
    ]),
  },
};
</script>

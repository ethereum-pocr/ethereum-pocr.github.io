<template>
  <v-row>
    <v-col cols="12" class="pb-0">
      <v-card>
        <v-card-title>Page to manage PoCR improvement proposals.</v-card-title>
      </v-card>
    </v-col>
    <v-col cols="12" class="pb-0">
      <v-card class="pa-2" v-if="isConnected">
        <v-card-subtitle>Create a new proposal.</v-card-subtitle>
        <v-card-text>
          this action will be done with your connected wallet and will reserve the ID of the Carbon Reduction Improvement Proposal that you must then create as a document in 
          <a :href="CRIPsUrl">{{CRIPsUrl}}</a>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            small
            v-if="!lastCRIPCreated"
            @click="reserveCRIP"
          >
            Reserve the next CRIP id
          </v-btn>
          <v-card-text  v-else>
            You have reserved the CRIP id <code>{{lastCRIPCreated}}</code>
          </v-card-text>
        </v-card-actions>
      </v-card>
    </v-col>
    
    <v-col cols="12" class="pb-0">
      <v-card class="pa-2">
        <v-card-title>List of the improvement proposals</v-card-title>
        <v-card-text>
          <v-data-table
            :items="CRIPS"
            :headers="cripsTableHeaders"
            :items-per-page="-1"
            hide-default-footer
          >
            <template v-slot:item.createdBlock="{ item }">
              <div>{{item.createdBlock}} <explorer type="block" :id="item.createdBlock"></explorer></div>
            </template>
            <template v-slot:item.documentation="{ item }">
              <a :href="item.url">crip-{{item.index}}.md</a>
            </template>
            <template v-slot:item.voteFromBlock="{ item }">
              <div>{{voteFromContent(item.index)}}</div>
              <div>at {{item.voteFromBlock}}</div>
            </template>
            <template v-slot:item.voteUntilBlock="{ item }">
              <div>{{voteUntilContent(item.index)}}</div>
              <div>at {{item.voteUntilBlock}}</div>
            </template>
            <template v-slot:item.auditors="{ item }">
              <div>Pro: {{item.auditorsFor}}</div>
              <div>Cons: {{item.auditorsAgainst}}</div>
            </template>
            <template v-slot:item.nodes="{ item }">
              <div>Pro: {{item.nodesFor}}</div>
              <div>Cons: {{item.nodesAgainst}}</div>
            </template>
            <template v-slot:item.useraction="{ item }">
              <v-radio-group v-model="item.vote" v-if="canVote(item.index)" @change="userVote(item)">
                <v-radio label="agree" :value="true"></v-radio>
                <v-radio label="reject" :value="false"></v-radio>
              </v-radio-group>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" class="pb-0">
      <v-card class="pa-2">
        <v-card-title>Your votes</v-card-title>
        <v-card-text>
          <v-data-table
            :items="userVotes"
            :headers="votesTableHeaders"
            :items-per-page="-1"
            hide-default-footer
          >
            <template v-slot:item.block="{ item }">
              <div>{{item.block}} <explorer type="tx" :id="item.txHash"></explorer></div>
            </template>

          </v-data-table>
        </v-card-text>
      </v-card>
    </v-col>

  </v-row>

</template>
<script>
import { CRIPBaseUrl, ROLES } from "../lib/const";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import $store from "@/store";
import { writeCallWithOptions, handleMMResponse, readOnlyCall } from "../lib/api";
import Explorer from "../components/ExplorerRedirect.vue";

export default {
  components: {Explorer},
  data: ()=>({
    lastCRIPCreated: undefined,
    CRIPS: [],
    userVotes: [],
    cripsTableHeaders: [
      { text: "Created on", value: "createdBlock" },
      { text: "Doc", value: "documentation" },
      { text: "Start in", value: "voteFromBlock" },
      { text: "Auditors votes", value: "auditors" },
      { text: "Nodes votes", value: "nodes" },
      { text: "Closes on", value: "voteUntilBlock" },
      { text: "Action", value: "useraction" },
    ],
    votesTableHeaders: [
      { text: "Created on", value: "block" },
      { text: "CRIP id", value: "index" },
      { text: "Decision", value: "decision" },
    ],
  }),
  computed: {
    blockNumber() {
      return $store.get("nodes/currentBlockNumber");
    },
    CRIPsUrl() {
      return CRIPBaseUrl
    },
    isConnected() {
      return !!$store.get("auth/wallet")
    },
    isNode() {
      return $store.get("auth/walletRole") == ROLES.AUDITED_NODE
    },
    isAuditor() {
      return $store.get("auth/walletRole") == ROLES.APPROVED_AUDITOR
    },
  },

  mounted() {
    this.fetchCRIPS()
    this.fetchUserVotes()
  },

  methods: {
    async reserveCRIP() {
      const prov = new Web3FunctionProvider($store.get("auth/provider"), ()=>Promise.resolve($store.get("auth/wallet")))
      const contract = $store.get("auth/contract");
      const currentBlock = this.blockNumber;

      await handleMMResponse(writeCallWithOptions("newProposal", {maxGas: 100000}))
      contract.events.IPChanged(prov.get({fromBlock: currentBlock}), {status: 0})
      .once("log", (log)=>{
        this.lastCRIPCreated = log.returnValues.index;
        this.fetchCRIPS();
      })
    },

    async fetchCRIPS() {
      const count = await readOnlyCall("nbImprovementProposals");
      const result = [];
      for (let index = 0; index < count; index++) {
        const crip = await readOnlyCall("getImprovementProposal", index)
        crip.index = Number.parseInt(crip.index)
        crip.voteFromBlock = Number.parseInt(crip.voteFromBlock)
        crip.voteUntilBlock = Number.parseInt(crip.voteUntilBlock)
        const url = new URL(`${CRIPBaseUrl}/crip-${crip.index}.md`)
        crip.url = url.href;
        result.push(crip)
      }
      this.CRIPS = result
    },

    async fetchUserVotes() {
      const wallet = $store.get("auth/delegatedWallet") || $store.get("auth/wallet");
      const prov = new Web3FunctionProvider($store.get("auth/provider"), ()=>Promise.resolve(wallet))
      const contract = $store.get("auth/contract");
      this.userVotes = [];
      contract.events.IPVote(prov.get({fromBlock: 1}), {voter: wallet})
      .on("log", (log)=>{
        console.log("Vote log", log);
        this.userVotes.push({
          index: Number.parseInt(log.returnValues.index),
          approval: Number.parseInt(log.returnValues.vote)>0 ? true : false,
          decision: Number.parseInt(log.returnValues.vote)>0 ? "Accepted" : "Rejected",
          txHash: log.transactionHash,
          block: log.blockNumber
        });
      })
    },

    canVote(index) {
      const crip = this.CRIPS.find(c=>c.index == index);
      if (!crip) return false;
      const currentBlock = this.blockNumber;
      const inVotingPeriod = crip.voteFromBlock <= currentBlock && crip.voteUntilBlock >= currentBlock
      return inVotingPeriod && (this.isNode || this.isAuditor)
    },
    voteFromContent(index) {
      const crip = this.CRIPS.find(c=>c.index == index);
      if (!crip) return "N/A";
      const nbBlocks = crip.voteFromBlock-this.blockNumber;
      console.log("voteFromContent", index, crip, nbBlocks);
      if (nbBlocks<=0) return "Opened";
      else return (nbBlocks*4/(3600*24)).toFixed(2) + " days";
    },
    voteUntilContent(index) {
      const crip = this.CRIPS.find(c=>c.index == index);
      if (!crip) return "N/A";
      const nbBlocks = crip.voteUntilBlock-this.blockNumber;
      console.log("voteFromContent", index, crip, nbBlocks);
      if (nbBlocks<=0) return "Closed";
      else return (nbBlocks*4/(3600*24)).toFixed(2) + " days";
    },

    async userVote(crip) {
      console.log("User vote", crip.index, crip.vote);
      if (typeof crip.vote !== "boolean") return;
      const funct = crip.vote? "voteForProposal" : "voteAgainstProposal";
      const response = await handleMMResponse(writeCallWithOptions(funct, {maxGas:100000}, crip.index));
      if (response === null) crip.vote = null;
      this.fetchCRIPS();
      this.fetchUserVotes();
    }
  }

};
</script>
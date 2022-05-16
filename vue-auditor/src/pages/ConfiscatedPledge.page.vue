<template>
  <v-row>
    <v-col cols="12">
      <h2>Manage the confiscated pledge of the auditors</h2>  
    </v-col>  
    <v-col cols="12">
      <v-card>
        <v-card-title>Total confiscated pledge</v-card-title>
        <v-card-text>{{ totalPledge }} CRC</v-card-text>
      </v-card>
    </v-col>

    
  </v-row>
</template>
<script>
import { call } from "vuex-pathify";

export default {
  data: ()=>({
    totalPledge:0
  }),

  async mounted() {
    this.totalPledge = await this.fetchConfiscatedPledge()
  },

  methods: {
    ...call("nodeGovernance", ["fetchConfiscatedPledge"])
  }

};
</script>
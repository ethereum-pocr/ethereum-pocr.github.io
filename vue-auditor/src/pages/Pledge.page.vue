<template>
  <v-row wrap>
    <v-col cols="12">
      <v-card>
        <v-card-title>Current Wallet Balance</v-card-title>
        <v-card-text> {{ balance }}&nbsp;CRC </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="8">
      <v-card>
        <v-card-title>Pledge Informations</v-card-title>
        <v-card-text>
          <div>Min pledge to start audit: {{ minPledgeAmount }}&nbsp;CRC</div>
          <div>
            Current pledged amount: {{ pledgedAmount }}&nbsp;CRC
            <v-btn small disabled>Start audit</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card>
        <v-card-title>Pledge Actions</v-card-title>
        <v-card-text>
          <div>Pledge more</div>
          <div>Redeem Pledge</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import { get, call } from "vuex-pathify";

export default {
  data: () => ({
    intervalId: null,
  }),
  computed: {
    ...get("pledge", ["balance", "minPledgeAmount", "pledgedAmount"]),
  },
  mounted() {
    this.fetchAllValues();
    this.intervalId = setInterval(this.fetchAllValues, 60 * 1000);
  },
  beforeRouteLeave(to, from, next) {
    clearInterval(this.intervalId);
    next();
  },
  methods: {
    ...call("pledge", ["fetchAllValues"]),
  },
};
</script>
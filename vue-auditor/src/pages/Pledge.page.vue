<template>
  <v-row wrap>
    <v-col cols="12">
      <v-card>
        <v-card-title>Current Wallet Balance</v-card-title>
        <v-card-text> {{ toEther(balance) }}&nbsp;CRC </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="8">
      <v-card>
        <v-card-title>Pledge Informations</v-card-title>
        <v-card-text>
          <div>
            Min pledge to start audit: {{ toEther(minPledgeAmount) }}&nbsp;CRC
          </div>
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
          <v-row>
            <v-col cols="12" class="pb-0">
              <v-text-field
                v-model="amountToAdd"
                dense
                hide-details
                outlined
                type="number"
                :min="0"
                placeholder="Amount to add to the pledge"
            /></v-col>
            <v-col cols="12">
              <v-btn small style="width: 100%" @click="pledgeMore"
                >Pledge more</v-btn
              >
            </v-col>
            <v-col cols="12">
              <v-btn
                small
                style="width: 100%"
                @click="redeemPledge"
                :disabled="pledgedAmount === 0"
                >Redeem Pledge</v-btn
              >
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import { get, call } from "vuex-pathify";
import { toEther } from "@/lib/numbers";

export default {
  data: () => ({
    intervalId: null,
    amountToAdd: 0,
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
    toEther,
    ...call("pledge", ["fetchAllValues", "addToPledge", "redeemPledge"]),
    async pledgeMore() {
      await this.addToPledge(this.amountToAdd);
      this.amountToAdd = 0;
    },
  },
};
</script>
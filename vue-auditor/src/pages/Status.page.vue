<template>
  <v-card class="pa-md-4 mx-lg-auto">
    <v-card-title> Status </v-card-title>
    <v-card-subtitle style="color: Green" v-if="registered && approved">
      APPROVED
    </v-card-subtitle>
    <v-card-subtitle style="color: red" v-if="registered && !approved">
      AWAITING APPROVAL
    </v-card-subtitle>
    <v-card-text v-if="!registered">
      <p>
        You are not registered, please make sure to register
        <v-btn small class="mx-2" @click="selfRegister" :disabled="mmIsOpen">
          Self register
        </v-btn>
      </p>
    </v-card-text>
    <v-card-text v-if="registered">
      <p style="color: black">
        You have the total vote of {{ approbationVotes }}
      </p>
    </v-card-text>
  </v-card>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  computed: {
    mmIsOpen: get("mmIsOpen"),
    ...get("auth", ["registered"]),
    ...get("status", ["approved", "approbationVotes"]),
  },
  mounted() {
    this.fetchIsRegistered();
    this.fetchIsApproved();
    this.fetchApprobationVotes();
  },
  methods: {
    ...call("auth", ["fetchIsRegistered", "selfRegister"]),
    ...call("status", ["fetchIsApproved", "fetchApprobationVotes"]),
  },
};
</script>

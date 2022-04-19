<template>
  <v-card class="pa-md-4 mx-lg-auto">
    <v-card-title> Status </v-card-title>
    <v-card-subtitle style="color: Green" v-if="registered && approved">
      APPROVED
    </v-card-subtitle>
    <v-card-subtitle style="color: red" v-if="registered && !approved">
      DENIED
    </v-card-subtitle>
    <v-card-text v-if="!registered">
      <p>You are not registered, please make sure to register</p>
      <router-link to="/auth"> <a> click here</a> </router-link>
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
    ...get("auth", ["registered"]),
    ...get("status", ["approbationVotes", "approved"]),
  },
  mounted() {
    this.fetchIsRegistered();
  },
  methods: {
    ...call("auth", ["fetchIsRegistered"]),
  },
};
</script>

<template>
  <div>
    <v-btn color="teal" dark @click="openMetaMaskConnectionDialog"
      >Connect Wallet</v-btn
    >
  </div>
</template>

<script>
import { call } from "vuex-pathify";

export default {
  methods: {
    ...call("auth", ["openMetaMaskConnectionDialog"]),
  },
};
</script>

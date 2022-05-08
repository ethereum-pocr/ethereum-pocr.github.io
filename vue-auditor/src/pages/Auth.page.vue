<template>
  <div>
    <v-btn color="teal" dark @click="openMetaMaskConnectionDialog"
      v-if="hasProviderMetamask"
      >Connect Metamask Wallet</v-btn
    >
    <br><br>
    <div v-if="hasProviderDirect">
      <v-btn color="teal" dark @click="openWeb3DirectConnectionDialog(wallet)"
        >Connect Wallet in company's custody</v-btn
      >
      <v-text-field
            label="Enter the wallet address"
            placeholder="capture your wallet address"
            outlined
            v-model="wallet"
          ></v-text-field>
    </div>
  </div>
</template>

<script>
import { call } from "vuex-pathify";

export default {
  data() {
    return {
      wallet: undefined
    }
  },
  computed: {
    hasProviderMetamask() {
      if (this.$store.state.auth.providerMetamask) return true;
      else return false;
    },
    hasProviderDirect() {
      if (this.$store.state.auth.providerDirect) return true;
      else return false;
    }
  },
  methods: {
    ...call("auth", ["openMetaMaskConnectionDialog", "openWeb3DirectConnectionDialog"]),
  },
};
</script>

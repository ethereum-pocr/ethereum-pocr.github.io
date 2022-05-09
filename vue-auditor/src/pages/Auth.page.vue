<template>
  <div>
    <v-btn color="teal" dark @click="openMetaMaskConnectionDialog"
      v-if="hasProviderMetamask"
      >Connect Metamask Wallet</v-btn
    >
    <br><br>
    <div v-if="hasProviderDirect">
      <v-btn color="teal" dark @click="prepareOpenWeb3DirectConnectionDialog"
        >Connect Wallet in company's custody</v-btn
      > <br><br>
      <v-combobox
            label="Enter the wallet address"
            placeholder="capture your wallet address"
            outlined counter clearable
            :search-input="wallet"
            @update:search-input="updateWallet"
            :items="wallets"
          ></v-combobox>
      <v-text-field
            label="Enter the wallet password"
            placeholder="capture your wallet password"
            outlined 
            :type="show?'text' : 'password'"
            @click:append="show = !show"
            v-model="password"
          ></v-text-field>
    </div>
  </div>
</template>

<script>
import { call } from "vuex-pathify";
import { getCustodyLastWallets } from "../lib/api"
export default {
  data() {
    return {
      wallet: undefined,
      wallets: [],
      password: undefined,
      show: false,
    }
  },
  async mounted() {
    const wallets = await getCustodyLastWallets();
    if (wallets.length>0) this.wallet = wallets[0];
    this.wallets = wallets;
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
    updateWallet(v) {
      this.wallet = v;
    },
    async prepareOpenWeb3DirectConnectionDialog() {
      await this.openWeb3DirectConnectionDialog({wallet: this.wallet, password: this.password});
      this.wallets = await getCustodyLastWallets();
    }
  },
};
</script>

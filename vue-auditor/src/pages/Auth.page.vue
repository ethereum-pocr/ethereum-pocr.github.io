<template>
  <div>
    <div v-if="hasProviderMetamask">
      <v-btn color="teal" dark @click="openMetaMaskConnectionDialog"
        >Connect Metamask Wallet</v-btn>
      <v-btn class="mx-3" color="teal" dark @click="goToInstallMetamask"
        >Switch / Install network</v-btn>

    </div>
    <br><br>
    <div v-if="hasProviderDirect">
      <v-btn color="teal" dark @click="prepareOpenWeb3DirectConnectionDialog"
        >Connect with below configuration</v-btn
      > <br><br>
      <v-select
          v-model="selectedNetwork"
          :hint="`node: ${selectedNetwork.nodeUrl}; custody: ${selectedNetwork.walletCustodyAPIBaseUrl}`"
          :items="networks"
          item-text="name"
          item-value="nodeUrl"
          persistent-hint
          return-object
          single-line
        ></v-select>
      <div v-if="hasCustodyApi">
        <br>
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
  </div>
</template>

<script>
import { call } from "vuex-pathify";
import { getCustodyLastWallets } from "../lib/api";
import { getDefaultNetwork, getNetworkList } from "../lib/config-file";

export default {
  data() {
    return {
      wallet: undefined,
      wallets: [],
      networks: [],
      selectedNetwork: {name: "undefined"},
      password: undefined,
      show: false,
    }
  },
  async mounted() {
    const wallets = await getCustodyLastWallets();
    if (wallets.length>0) this.wallet = wallets[0];
    this.wallets = wallets;

    const config = this.$store.get("config");
    this.networks = getNetworkList(config);
    this.selectedNetwork = getDefaultNetwork(config);
  },
  computed: {
    hasProviderMetamask() {
      if (this.$store.state.auth.providerMetamask) return true;
      else return false;
    },
    hasProviderDirect() {
      if (this.$store.state.auth.providerDirect) return true;
      else return false;
    },
    hasCustodyApi() {
      if (this.$store.state.auth.providerDirect && this.$store.state.auth.providerDirect.custodyModel == "api" ) return true;
      else return false;
    },
  },
  methods: {
    ...call("auth", ["openMetaMaskConnectionDialog", "openWeb3DirectConnectionDialog"]),
    updateWallet(v) {
      this.wallet = v;
    },
    async prepareOpenWeb3DirectConnectionDialog() {
      await this.openWeb3DirectConnectionDialog({wallet: this.wallet, password: this.password, nodeUrl: this.selectedNetwork.nodeUrl});
      this.wallets = await getCustodyLastWallets();
    },

    goToInstallMetamask() {
      this.$router.push({ name: 'installMetaMask' })
    }
  },
};
</script>

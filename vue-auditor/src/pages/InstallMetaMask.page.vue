<template>
  <div>
    <div v-if="!providerMetamask">
      <div>Install MetaMask and then reload this application.</div>
      <div>Installation instructions available at <a href="https://metamask.io/download/" target="_blank">https://metamask.io/download/</a></div>
    </div>
    <div v-if="providerMetamask">
      <v-row>
        <v-col cols="4" v-for="network of networks" :key="network.chainId">
          <v-card>
            <v-card-title>{{network.name}}</v-card-title>
            <v-card-text>
              <div>{{network.title}}</div>
              <div>chainID: {{network.chainId}}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="activateOrInstall(network)">Activate</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>
<script>
import { get, call } from "vuex-pathify";
import { getExplorerUrl } from '../lib/config-file';
import {switchEthereumProviderNetwork, getEthereumProviderChainInfo} from "../lib/ethereum-compatible-wallet";
import router from "../router.js";

export default {
  data: ()=>({
    networks: []
  }),
  computed: {
    ...get(["config"]),
    ...get("auth", ["provider", "providerModel", "providerMetamask", "wallet"]),
  },

  async mounted() {
    // await this.detectProvider();
    const res = await fetch('https://chainid.network/chains.json')
    const all = await res.json()
    this.networks = all.filter(n=>n.chain == 'CRC')
  },

  methods: {
    ...call(["errorFlash"]),
    ...call("auth", ["detectProvider", "openMetaMaskConnectionDialog", "attemptToConnectWallet"]),
    async activateOrInstall(network) {
      if (!this.providerMetamask) throw new Error("metamask has not been installed")
      const ethereum = this.providerMetamask.provider;
      const chainId = '0x'+Number(network.chainId).toString(16);
      const explorerUrl = getExplorerUrl(this.config, network.chainId);
      try {
        await this.openMetaMaskConnectionDialog({noRedirect: true});

        if (!this.wallet) throw new Error("Could not find an account");
        const info = await getEthereumProviderChainInfo(ethereum);
        if (info.chainId != network.chainId) {
          await switchEthereumProviderNetwork(ethereum, {
            chainId, 
            chainName: network.name,
            rpcUrls: [...network.rpc],
            nativeCurrency: network.nativeCurrency,
            blockExplorerUrls: network.explorers.filter(e=>e.standard=='EIP3091').map(e=>e.url).concat(explorerUrl)
          }, this.wallet)
        } else {
          this.attemptToConnectWallet()
        }
        router.push({ name: "dashboard" });
      } catch (addError) {
        // handle "add" error
        this.errorFlash("Fail adding the network:"+addError.message)
      }
    }
  }
};
</script>
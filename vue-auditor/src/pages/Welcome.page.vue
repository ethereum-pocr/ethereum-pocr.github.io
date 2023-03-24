<template>
  <div>
    <h2>Proof of Climate awaReness</h2>
    <div>The consensus that incentivizes nodes to improving their environmental footprint by earning tokens (CRC / ₡)</div>
    <img src="https://github.com/ethereum-pocr/.github/raw/main/profile/PoCR-Marketing.png" width="90%"/>
    <v-divider class="my-4"></v-divider>
    <div>To read the detail of this consensus and methodology go to the <a href="https://github.com/ethereum-pocr/whitepaper" target="_blank">whitepaper</a></div>
    <v-divider class="my-4"></v-divider>
    <div>This application gives you a view on the network and the nodes in the  <a @click="goTo('dashboard')"><u>Dashboard</u></a></div>
    <div><a @click="goTo('authentication')"><u>Connect</u></a> with a wallet to operate as a node or as an auditor of carbon footprint  </div>
    <div>A basic block and transaction explorer is available <a href="https://ethereum-pocr.github.io/explorer/" target="_blank">here</a></div>
    <v-divider class="my-4"></v-divider>
    <div>This application is open sourced and its code is available in <a href="https://github.com/ethereum-pocr/ethereum-pocr.github.io/tree/main/vue-auditor" target="_blank">github</a></div>

    <v-divider class="my-4"></v-divider>
  </div>
</template>

<script>
import { call } from "vuex-pathify";
export default {


  mounted() {
    this.startInitialization()
  },
  methods: {
    ...call(["startInitialization"]),
    goTo(routeName) {
      if (this.$route.name === routeName) return;
      this.$router.push({ name: routeName });
    },
  }
}
</script>

<style>

</style>
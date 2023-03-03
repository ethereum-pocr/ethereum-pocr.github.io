<template>
  <v-app id="inspire">
    <v-container>
      <app-menu v-model="drawerDisplayed"></app-menu>
      <v-app-bar app clipped-left flat color="teal lighten-2">
        <v-app-bar-nav-icon v-if="!drawerDisplayed" @click="showDrawer"></v-app-bar-nav-icon>
        <v-toolbar-title @click="goTo('welcome')">Proof of Climate awaReness</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip
          class="ma-2"
          color="blue"
          text-color="white"
        >
          {{walletRole}}
        </v-chip> 
        <v-chip
          v-if="wallet"
          class="ma-2"
          color="blue"
          text-color="white"
        >
          <v-icon @click="disconnect" class="mr-1">mdi-close</v-icon> {{wallet}}
        </v-chip>
        <v-chip
          class="ma-2"
          color="blue"
          text-color="white"
        >
          {{currentBlockNumber}}
        </v-chip> 
        <v-chip
          class="ma-2"
          color="blue"
          text-color="white"
        >
          {{chainName}}
        </v-chip> 

      </v-app-bar>

      <v-main>
        <v-container class="py-8">
          <router-view></router-view>
        </v-container>
      </v-main>
    </v-container>
    <v-overlay :value="mmIsOpen">
      <v-progress-circular indeterminate></v-progress-circular>
    </v-overlay>
    <v-overlay :value="mmConnecting">
      <v-card>
        <v-card-title>Authorize the connection of the website to the browser wallet</v-card-title>
        <v-card-actions>
          <v-btn @click="cancelWalletConnection">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-overlay>
    <v-snackbar
      v-model="displaySnackbar"
      multi-line
      :color="snackbarColor"
      right
    >
      {{ snackbarMessage }}
    </v-snackbar>
    <wallet-authentication-dialog
      ref="walletAuthenticationDialog"
    ></wallet-authentication-dialog>
  </v-app>
</template>

<script>
import AppMenu from "./components/AppMenu.vue";
import WalletAuthenticationDialog from "./components/WalletAuthenticationDialog.vue";
import { get, sync, call } from "vuex-pathify";
import $store from "@/store/index";

export default {
  components: { AppMenu, WalletAuthenticationDialog },
  data: () => ({
    drawerDisplayed: true
  }),

  computed: {
    ...sync(["displaySnackbar", "snackbarMessage", "snackbarColor"]),
    ...get(["mmIsOpen"]),
    ...get("auth", ["wallet", "walletRole", "chainName", "mmConnecting"]),
    ...get("nodes", ["currentBlockNumber"]),
  },

  methods: {
    ...call("auth", ["detectProvider", "disconnect", "cancelWalletConnection"]),
    showDrawer() {
      this.drawerDisplayed = true;
    },
    goTo(routeName) {
      if (this.$route.name === routeName) return;
      this.$router.push({ name: routeName });
    },
  },

  mounted() {
    // record the authentication function to make it available in api.js
    $store.set("auth/walletAuthenticationFunction", this.$refs.walletAuthenticationDialog.authenticate);
    // this.detectProvider();
  }
};
</script>

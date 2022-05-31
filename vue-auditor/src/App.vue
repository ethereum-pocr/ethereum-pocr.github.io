<template>
  <v-app id="inspire">
    <v-container>
      <app-menu></app-menu>
      <v-app-bar app clipped-left flat color="teal lighten-2">
        <v-toolbar-title>Proof of Carbon Reduction</v-toolbar-title>
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
          close
          color="blue"
          text-color="white"
          @click:close="disconnect"
        >
          {{wallet}}
        </v-chip>
        <v-chip
          class="ma-2"
          color="blue"
          text-color="white"
        >
          {{currentBlockNumber}}
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
  data: () => ({}),

  computed: {
    ...sync(["displaySnackbar", "snackbarMessage", "snackbarColor"]),
    ...get(["mmIsOpen"]),
    ...get("auth", ["wallet", "walletRole"]),
    ...get("nodes", ["currentBlockNumber"]),
  },

  methods: {
    ...call("auth", ["detectProvider", "disconnect"]),
  },

  mounted() {
    // record the authentication function to make it available in api.js
    $store.set("auth/walletAuthenticationFunction", this.$refs.walletAuthenticationDialog.authenticate) 
  }
};
</script>

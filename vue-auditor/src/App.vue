<template>
  <v-app id="inspire">
    <v-container>
      <app-menu></app-menu>
      <v-app-bar app clipped-left flat color="teal lighten-2">
        <v-toolbar-title> Audit UI 2</v-toolbar-title>
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
  </v-app>
</template>

<script>
import AppMenu from "./components/AppMenu.vue";
import { get, sync, call } from "vuex-pathify";

export default {
  components: { AppMenu },
  data: () => ({}),

  computed: {
    ...sync(["displaySnackbar", "snackbarMessage", "snackbarColor"]),
    ...get(["mmIsOpen"]),
  },

  methods: {
    ...call("auth", ["detectProvider"]),
  },
};
</script>

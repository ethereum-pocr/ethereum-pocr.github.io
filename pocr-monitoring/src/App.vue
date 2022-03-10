<template>
  <v-app id="inspire">
    <v-system-bar app>
      <v-spacer></v-spacer>

      <v-icon>mdi-square</v-icon>

      <v-icon>mdi-circle</v-icon>

      <v-icon>mdi-triangle</v-icon>
    </v-system-bar>

    <login v-if="!loggedIn"></login>
    <div v-if="loggedIn">

    <app-menu ></app-menu>

    <v-main>
      <v-container class="py-8 px-6" fluid>
        <dashboard v-if="selectedItem == 'dashboard'"></dashboard>
      </v-container>
    </v-main>
    </div>
  </v-app>
</template>

<script>
import Dashboard from "./components/Dashboard.vue";
import AppMenu from "./components/AppMenu.vue";
import Login from "./components/Login.vue";

import { mapActions } from "vuex";
export default {
  components: { Dashboard, AppMenu, Login },
  data: () => ({
    pollingInError: false,
    lastErrorMessage: ""
  }),
  computed: {
    selectedItem() {
      return this.$store.getters.activePage;
    },
    loggedIn() {
      // use the below line to enable external IDP authentication with the Login.vue component
      return true; // and remove this one 
      //return !!this.$store.getters.authenticated;
    }
  },
  methods: {
    ...mapActions(["loadData", "refreshAccessToken"]),

  },
  mounted() {

  }
};
</script>

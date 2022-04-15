<template>
  <v-app id="inspire">
    <v-container>
      <app-menu></app-menu>
      <v-app-bar app clipped-left flat color="teal lighten-2">
        <v-toolbar-title> Audit UI </v-toolbar-title>
      </v-app-bar>

      <v-main>
        <v-container class="py-8">
          <router-view></router-view>
        </v-container>
      </v-main>
    </v-container>
  </v-app>
</template>

<script>
import AppMenu from "./components/AppMenu.vue";
// import { getContractInstance } from "@/lib/api";
import { call } from "vuex-pathify";

export default {
  components: { AppMenu },
  data: () => ({}),

  async mounted() {
    // getContractInstance("Governance");
  },

  methods: {
    ...call("auth", ["detectProvider"]),
  },
};
</script>

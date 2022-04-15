<template>
  <v-navigation-drawer v-model="drawer" app clipped flat>
    <v-sheet color="grey lighten-4 d-flex flex-column align-center">
      <v-avatar class="ma-4" color="grey darken-1" size="64">
        <v-icon dark> mdi-account-circle </v-icon>
      </v-avatar>

      <!-- <div v-if="profile">{{ profile.name }}</div>
      <div v-if="profile">{{ profile.email }}</div> -->
    </v-sheet>

    <v-divider></v-divider>
    <v-list>
      <v-list-item-group :value="$route.name" mandatory color="primary">
        <v-list-item
          v-for="{ icon, label, route } in links"
          :key="route"
          :value="route"
          @click="goTo(route)"
          link
        >
          <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ label }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
// import { get } from "vuex-pathify";
export default {
  data: () => ({
    drawer: null,
    links: [
      { icon: "mdi-wallet", label: "Status", route: "status" },
      { icon: "mdi-wallet", label: "Audit", route: "audit" },
      { icon: "mdi-wallet", label: "Pledge", route: "pledge" },
      { icon: "mdi-wallet", label: "History", route: "history" },
    ],
  }),

  computed: {
    // ...get("auth", ["profile"]),
  },

  methods: {
    goTo(routeName) {
      if (this.$route.name === routeName) return;
      this.$router.push({ name: routeName });
    },
  },
};
</script>

<style></style>

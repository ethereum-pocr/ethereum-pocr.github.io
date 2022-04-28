<template>
  <v-navigation-drawer v-model="drawer" app clipped flat>
    <v-divider></v-divider>
    <v-list>
      <v-list-item-group :value="$route.name" mandatory color="primary">
        <template
          v-for="(
            { icon, label, route, required, subheader }, index
          ) in sidenav"
        >
          <v-divider
            v-if="subheader && label !== '' && index !== 0"
            :key="`${subheader}-divider`"
          ></v-divider>
          <v-subheader :key="label" v-if="subheader && label !== ''">{{
            label
          }}</v-subheader>
          <v-list-item
            v-else
            :key="route"
            :value="route"
            @click="goTo(route)"
            :disabled="required && !required()"
            link
          >
            <v-list-item-icon>
              <v-icon>{{ icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ label }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list-item-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { get } from "vuex-pathify";
import { routes } from "@/router";

export default {
  data: (vm) => ({
    drawer: null,
    links: [
      {
        icon: "mdi-wallet",
        label: "Status",
        route: "status",
        required: () => !vm.mmIsOpen,
      },
      {
        icon: "mdi-wallet",
        label: "Audit",
        route: "audit",
        required: () => !vm.mmIsOpen && vm.approved,
      },
      {
        icon: "mdi-wallet",
        label: "Pledge",
        route: "pledge",
        required: () => !vm.mmIsOpen && vm.approved,
      },
      {
        icon: "mdi-wallet",
        label: "History",
        route: "history",
        required: () => !vm.mmIsOpen && vm.approved,
      },
    ],
  }),

  computed: {
    ...get(["mmIsOpen"]),
    ...get("auth", ["registered"]),
    ...get("status", ["approved"]),
    sidenav() {
      const list = routes
        .filter((r) => r?.meta?.displayInSidenav !== undefined)
        .map((r) => ({
          icon: "mdi-wallet",
          label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
          route: r.name,
          meta: r.meta,
        }));
      const nav = [];
      const categories = [];
      for (const el of list) {
        if (
          el.meta &&
          el.meta.displayInSidenav !== "" &&
          !categories.includes(el.meta.displayInSidenav)
        ) {
          nav.push({ subheader: true, label: el.meta.displayInSidenav });
          categories.push(el.meta.displayInSidenav);
        }
        nav.push(el);
      }
      return nav;
    },
  },

  mounted() {
    console.log("routes", routes);
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

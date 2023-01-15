<template>
  <v-navigation-drawer v-model="drawer" @input="drawerChange" app clipped flat>
    <v-divider></v-divider>
    <v-list>
      <v-list-item-group :value="$route.name" mandatory color="primary">
        <template
          v-for="(
            { icon, label, route, disabled, subheader }, index
          ) in sidenav"
        >
          <v-divider
            v-if="subheader && label !== '' && index !== 0"
            :key="`${label}-divider`"
          ></v-divider>
          <v-subheader :key="label" v-if="subheader && label !== ''">{{
            label
          }}</v-subheader>
          <v-list-item
            v-else
            :key="route"
            :value="route"
            @click="goTo(route)"
            :disabled="disabled()"
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
    <v-spacer ></v-spacer>
    <img src="PoCR_Logo.png" width="100%">
  </v-navigation-drawer>
</template>

<script>
import { get } from "vuex-pathify";
import { routes } from "@/router";

export default {
  props: {
    value: Boolean,
  },
  data: () => ({
    drawer: true,
  }),
  watch: {
    value() {
      this.drawer = this.value;
    }
  },
  computed: {
    ...get(["mmIsOpen", "config"]),
    ...get("auth", ["registered"]),
    ...get("status", ["approved"]),
    sidenav() {
      // Filter the routes to keep the ones that could appear in the sidenav,
      // and map them to a more usable object
      const list = routes
        .filter((r) => r?.meta?.displayInSidenav !== undefined)
        .map((r) => ({
          icon: "mdi-wallet",
          label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
          route: r.name,
          meta: r.meta,
          restricted: r.meta.restricted,
          disabled: () =>
            this.mmIsOpen ||
            (r.meta.restricted && !r.meta.restricted({ store: this.$store })),
          hidden: r.meta.hidden,
        }));

      const nav = [];
      const categories = [];
      
      for (const el of list) {
        if (el.hidden && el.hidden({ store: this.$store, config: this.config })) continue;
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
    drawerChange() {
      // console.log("Drawer displayed changed", this.value, this.drawer);
      this.$emit("input", this.drawer);
    },
    goTo(routeName) {
      if (this.$route.name === routeName) return;
      this.$router.push({ name: routeName });
    },
  },
};
</script>

<style></style>

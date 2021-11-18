<template>
  <v-navigation-drawer v-model="drawer" app>
      <v-sheet color="grey lighten-4" class="pa-4">
        <v-avatar class="mb-4" color="grey darken-1" size="64">
          <v-icon dark>
            mdi-account-circle
          </v-icon>
        </v-avatar>

        <div>{{$store.getters.userIdentity.name}}</div>
        <div>{{$store.getters.userIdentity.email}}</div>
      </v-sheet>

      <v-divider></v-divider>

      <v-list>
        <v-list-item-group :value="value" @change="onChangeEvt($event)" color="primary">
          <v-list-item v-for="[icon, text] in links" :key="icon" link>
            <v-list-item-icon>
              <v-icon>{{ icon }}</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>{{ text }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
</template>

<script>
import { mapActions } from "vuex";
export default {
  props: ['value'],
  data: ()=>({
    drawer: null,
    links: [
      ["mdi-view-dashboard-outline", "Dashboard", "dashboard"],
      ["mdi-wallet", "Wallets", "wallets"],
      ["mdi-wallet-plus-outline", "New wallet", "new-wallet"],
      ["mdi-bank", "Invoices", "invoices"],
    ],
  }),
  methods: {
    ...mapActions(["goToPage"]),
    onChangeEvt(ev) {
      //this.$emit('input', this.links[ev][2])
      this.goToPage(this.links[ev][2]);
    }
  }
}
</script>

<style>

</style>
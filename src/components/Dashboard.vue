<template>
  <v-container>
    <v-layout row wrap >
      <v-card elevation="3" height="200" width="200" class="ma-6"
        @click="goToPage('wallets')"
       >
        <v-card-title class="align-center">
          <span class="text-h1">X</span> items
        </v-card-title>
        <v-card-subtitle>Subtitle</v-card-subtitle>
        <v-card-text>detail text</v-card-text>
      </v-card>
      <v-card elevation="3" height="200" width="200" class="ma-6"
      v-for="card in Array.from({length:3}, x=>x)" :key="card" >

      </v-card>
    </v-layout>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";

export default {
  data: ()=>{
    return {

    }
  },
  computed: {
  },
  methods: {
    ...mapActions(["goToPage"]),
  }
}
</script>

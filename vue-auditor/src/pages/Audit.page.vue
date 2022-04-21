<template>
  <v-row>
    <v-col>Number of Nodes: {{ nbOfNodes }}</v-col>
    <v-col>Total Footprint: {{ totalFootprint }}</v-col>
    <v-col cols="12"> Nodes: </v-col>
  </v-row>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  computed: {
    ...get("audit", ["nbOfNodes", "totalFootprint"]),
  },

  mounted() {
    this.fetchAllValues();
  },
  methods: {
    ...call("audit", ["fetchAllValues"]),
  },
};
</script>

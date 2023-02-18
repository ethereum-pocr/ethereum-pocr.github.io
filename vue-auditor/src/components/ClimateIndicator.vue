<template>
    <span class="helper" @click="displayed=!displayed">
      {{to1000s(value)}}
      <v-dialog v-model="displayed" width="auto">
        <v-card>
          <v-card-title>Environmental footprint breakdown of {{to1000s(value)}} ({{to1000s(Math.pow(10, efDecimals))}} EF )</v-card-title>
          <v-card-text>
            <div><i>1 Environmental footprint (EF) is a normalized indicator of the impact of 1 human being. <a href="https://eplca.jrc.ec.europa.eu/EnvironmentalFootprint.html" target="_blank">Source</a>.</i></div>
            <div><i>The table show equivalence of the environmental footprint in each of the indicators</i></div>
            <v-simple-table>
              <thead>
                <tr>
                  <th class="text-left">
                    Indicator
                  </th>
                  <th class="text-left">
                    {{to1000s(value / Math.pow(10, efDecimals), efDecimals)}} EF equivalent to 
                  </th>
                  <!-- <th class="text-left">
                    Normalized value
                  </th> -->
                </tr>
              </thead>
              <tbody>
                  <tr v-for="ind of fromSingleIndicator(value)" :key="ind.name">
                    <td>{{ind.name}} 
                      <v-tooltip top>
                        <template v-slot:activator="{ on, attrs }">
                          <v-icon color="blue" dense v-on="on" v-bind="attrs">mdi-information-outline</v-icon>
                        </template>
                        <span>{{ind.definition}}</span>
                      </v-tooltip>
                    </td>
                    <td>{{ to1000s(ind.valueEq, 2) }} {{ind.unit}}</td>
                    <!-- <td>{{ to1000s(ind.contribution/Math.pow(10, efDecimals), efDecimals) }} EF ({{to1000s(100*ind.contribution/value,2)}}%)</td> -->
                  </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>
        </v-card>
      </v-dialog>
    </span>

</template>

<script>
import { get } from "vuex-pathify";
import {to1000s} from "../lib/numbers";
export default {
  props: {
    value: {type: Number},
  },
  data: () => ({
    displayed:false
  }),
  computed: {
    ...get("climate", ["fromSingleIndicator", "efDecimals"]),
  },
  methods: {
    to1000s,
    
  }
}
</script>

<style>
.helper {
  cursor: help;
}
</style>
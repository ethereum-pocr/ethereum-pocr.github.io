<template>
    <span class="helper" @click="displayed=!displayed">
      {{to1000s(value)}}
      <v-dialog v-model="displayed" width="auto">
        <v-card>
          <v-card-title>Environmental footprint of {{to1000s(value)}} &nbsp; <span class="text-caption">1/{{to1000s(Math.pow(10, efDecimals))}}th</span> EF is equivalent to</v-card-title>
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
            <div>Measure of EF are for 1 F.U. as per LCA methodology (or multiple FU in the case of the whole network)</div>
            <div>Functional Unit: <i>{{functionalUnit}}</i></div>
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
    ...get("climate", ["fromSingleIndicator", "efDecimals", "functionalUnit"]),
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
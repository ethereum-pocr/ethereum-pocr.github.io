<template>
    <span class="helper" @click="displayed=!displayed">
      {{to1000s(value)}}
      <v-dialog v-model="displayed" width="auto">
        <v-card>
          <v-card-title>Environmental footprint breakdown of {{to1000s(value)}} (EF by person)</v-card-title>
          <v-card-text>
            <v-simple-table>
              <thead>
                <tr>
                  <th class="text-left">
                    Indicator
                  </th>
                  <th class="text-left">
                    Value
                  </th>
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
                    <td>{{ to1000s(ind.value, 2) }} {{ind.unit}}</td>
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
    ...get("climate", ["fromSingleIndicator"]),
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
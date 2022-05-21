<template>
  <v-row>
    <v-tabs v-model="currentTab" centered slider-color="primary">
      <v-tab href="#footprints"> Footprints </v-tab>
      <v-tab href="#pledges"> Pledges </v-tab>
    </v-tabs>

    <v-tabs-items v-model="currentTab" style="width: 100%">
      <v-tab-item value="footprints">
        <v-card>
          <v-card-text>
            <v-data-table
              :items="footprintHistory"
              :headers="footprintTableHeaders"
              :items-per-page="-1"
              hide-default-footer
            >
              <template v-slot:item.node="{ item }">
                  <div>{{ item.node }}</div>
                  <div>{{ item.nodeName }}</div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item value="pledges">
        <v-card>
          <v-card-title>Your pledge history</v-card-title>
          <v-card-text>
            <v-data-table
              :items="pledgeHistory"
              :headers="pledgeTableHeaders"
              :items-per-page="-1"
              hide-default-footer
            >
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-row>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  data: () => ({
    currentTab: "footprints",
    footprintTableHeaders: [
      { text: "Block N°", value: "blockNumber" },
      { text: "Auditor", value: "auditorName" },
      { text: "Node", value: "node" },
      { text: "Assigned", value: "footprint" },
    ],
    pledgeTableHeaders: [
      { text: "Block N°", value: "blockNumber" },
      // { text: "Auditor address", value: "auditor" },
      { text: "Pledge", value: "pledge" },
      { text: "Total", value: "total" },
    ],
  }),

  computed: {
    ...get("history", ["footprintHistory", "pledgeHistory"]),
  },

  async mounted() {
    this.fetchAllValues();
  },

  methods: {
    ...call("history", ["fetchAllValues"]),
  },
};
</script>

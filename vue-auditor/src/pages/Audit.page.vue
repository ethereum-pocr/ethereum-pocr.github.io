<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Number of Nodes</v-card-title>
        <v-card-text>{{ nbOfNodes }}</v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card>
        <v-card-title>Total Footprint</v-card-title>
        <v-card-text>{{ totalFootprint }} </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12">
      <v-card>
        <v-card-title>Nodes</v-card-title>
        <v-card-text>
          <v-data-table
            :items="sealers"
            :headers="tableHeaders"
            :items-per-page="-1"
            hide-default-footer
          >
            <template v-slot:item.vanity="{ item }">
              <div>Address: {{ item.address }}</div>
              <div>Name: {{ item.vanity.custom }}</div>
            </template>
            <!-- 
            <template v-slot:item.footprint="{ item }">
				{{ item.footprint }}
              <v-edit-dialog
                @update:return-value="setFootprint"
                large
                persistent
              >
                {{ item.footprint }}
                <template v-slot:input>
                  <v-text-field
                    :value="item.footprint"
                    label="Edit"
                    single-line
                    type="number"
                  ></v-text-field>
                </template>
              </v-edit-dialog>
            </template> -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                color="primary"
                small
                @click="openUpdateFootprintDialog(item)"
              >
                Update footprint
              </v-btn>
            </template>
          </v-data-table>

          <v-dialog v-model="footprintDialog" width="500">
            <v-card v-if="selectedSealer">
              <v-card-title>
                Update Footprint for {{ selectedSealer.address }}
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6" class="pb-0">
                    <v-text-field
                      type="number"
                      outlined
                      dense
                      v-model="newFootprintValue"
                    ></v-text-field>
                  </v-col>
                  <v-col class="pb-0">
                    <v-btn @click="footprintDialog = false">Cancel</v-btn>
                  </v-col>
                  <v-col class="pb-0">
                    <v-btn color="primary" @click="submitNewFootprint">
                      Submit
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col>
      <v-card>
        <v-card-title>Number of Auditors</v-card-title>
        <v-card-text>{{ nbAuditors }}</v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  data: () => ({
    tableHeaders: [
      { text: "Node", value: "vanity" },
      { text: "Footprint", value: "footprint" },
      { text: "Actions", value: "actions", sortable: false },
    ],
    footprintDialog: false,
    selectedSealer: null,
    newFootprintValue: 0,
  }),
  computed: {
    ...get("audit", ["nbOfNodes", "totalFootprint", "sealers"]),
    ...get("nodeGovernance", ["nbAuditors", "auditors"]),
  },

  mounted() {
    this.fetchAllValues();
    this.fetchAllAuditorsValues();
  },
  methods: {
    ...call("audit", ["fetchAllValues", "updateFootprint"]),
    ...call("nodeGovernance", ["fetchAllAuditorsValues"]),
    openUpdateFootprintDialog(sealer) {
      this.selectedSealer = sealer;
      this.newFootprintValue = sealer.footprint;
      this.footprintDialog = true;
    },

    async submitNewFootprint() {
      this.footprintDialog = false;
      await this.updateFootprint({
        sealerAddress: this.selectedSealer.address,
        footprint: this.newFootprintValue,
      });
    },
  },
};
</script>

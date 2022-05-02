<template>
  <v-row>

    <v-col>
      <v-card>
        <v-card-title>Number of Auditors</v-card-title>
        <v-card-text>{{ nbAuditors }}</v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12">
      <v-card>
        <v-card-title>Auditors</v-card-title>
        <v-card-text>
          <v-data-table
              :items="auditors"
              :headers="tableHeadersAuditors"
              :items-per-page="-1"
              hide-default-footer
          >
            <template v-slot:item.status="{ item }">
              <div>{{ item.isApproved ? "Oui" : "Non" }}</div>
            </template>
            <template v-slot:item.votes="{ item }">
              <div>{{ item.nbVotes }} / {{ item.minVotes }} avant {{ item.isApproved ? "Révocation" : "Approbation" }}</div>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                  color="primary"
                  small
                  @click="nodeVote(item)"
              >
                {{ computeLabel(item) }}
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-col>

  </v-row>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  data: () => ({
    tableHeadersAuditors: [
      { text: "Auditor", value: "address" },
      { text: "Approuvé", value: "status" },
      { text: "Votes courants", value: "votes" },
      { text: "Actions", value: "actions", sortable: false },
    ],
    switchState: false,

  }),
  computed: {
    ...get("nodeGovernance", ["nbAuditors", "auditors"]),
  },

  async mounted() {
    await this.fetchAllAuditorsValues();
  },
  methods: {
    ...call("nodeGovernance", ["fetchAllAuditorsValues", "voteAuditor"]),

    computeLabel(item) {
      // auditor is approved, vote for unapproved
      if (item.isApproved) {
        if (item.currentVote) {
          return "Voter pour révoquer";
        }
        return "Retirer mon vote de révocation";
      }
      // auditor is not approved, vote for approved
      if (item.currentVote) {
        return "Retirer mon vote de d'approbation";
      }
      return "Voter pour approuver";
    },

    async nodeVote(item) {
      console.log(`address : ${item.address} / vote value : ${!item.currentVote}`);
      try {
        await this.voteAuditor({
          auditorAddress: item.address,
          accept: !item.currentVote
        });
        await this.fetchAllAuditorsValues();
      } catch (error) {
        console.log(error);
        await this.fetchAllAuditorsValues();
        throw error;
      }
    },
  },
};
</script>

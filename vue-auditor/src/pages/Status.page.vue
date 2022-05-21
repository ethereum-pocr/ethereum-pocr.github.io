<template>
  <div>

  <v-card class="pa-md-4 mx-lg-auto">
    <v-card-title v-if="walletRole != ROLES.VISITOR"> {{walletRole}} {{wallet}}</v-card-title>
    <v-card-title v-else> Visitor</v-card-title>
    <v-card-subtitle >
      {{currentWalletBalanceEth}} CRC
    </v-card-subtitle>  
  </v-card>

  <v-card class="pa-md-4 mx-lg-auto" v-if="isAuditor">
    <v-card-title> Status </v-card-title>
    <v-card-subtitle style="color: Green" v-if="registered && approved">
      APPROVED
    </v-card-subtitle>
    <v-card-subtitle style="color: red" v-if="registered && !approved">
      AWAITING APPROVAL
    </v-card-subtitle>
    <v-card-text v-if="registered && !approved">
      <p style="color: black">
        You have the total vote of {{ approbationVotes }}
      </p>
    </v-card-text>
  </v-card>

  <v-card class="pa-md-4 mx-lg-auto" v-if="walletRole == ROLES.USER_CONNECTED">
    <v-card-text>
      <p>
        If you wish to become an auditor you must register here
        <v-btn small class="mx-2" @click="selfRegister" :disabled="mmIsOpen">
          Self register
        </v-btn>
      </p>
    </v-card-text>
    <v-card-text>
      <p>
        If you need this wallet to acts as a delegate for your node, execute the following command from your node eth console
        <code>{{registerDelegateCommandLine}}</code>
      </p>
    </v-card-text>
  </v-card>
  </div>
</template>

<script>
import { get, call } from "vuex-pathify";
import { toEther } from "../lib/numbers";
import { ROLES } from "../lib/const";
import { getCallData } from "../lib/api"

export default {
  data: ()=>({
    registerDelegateCommandLine: ""
  }),
  computed: {
    ROLES: ()=>ROLES,
    mmIsOpen: get("mmIsOpen"),
    ...get("auth", ["registered", "walletRole", "wallet"]),
    ...get("status", ["approved", "approbationVotes"]),
    ...get("nodes", ["currentWalletBalanceWei"]),
    currentWalletBalanceEth() {
      return toEther(this.currentWalletBalanceWei).toFixed(4);
    },
    isAuditor() {
      return [ROLES.APPROVED_AUDITOR, ROLES.PENDING_AUDITOR].includes(this.walletRole);
    },
  },
  async mounted() {
    this.fetchIsRegistered();
    this.fetchIsApproved();
    this.fetchApprobationVotes();

    this.registerDelegateCommandLine = await getCallData("allowDelegate", this.wallet)
  },
  methods: {
    ...call("auth", ["fetchIsRegistered", "selfRegister"]),
    ...call("status", ["fetchIsApproved", "fetchApprobationVotes"]),
  },
};
</script>

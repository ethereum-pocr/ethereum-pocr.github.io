<template>
  <div>Status Page. Registered: {{ registered }}, {{ approved }}</div>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  computed: {
    ...get("auth", ["registered"]),
    ...get("status", ["approved"]),
  },
  mounted() {
    this.fetchIsRegistered();
    this.fetchIsApproved();
    this.fetchApprobationVotes();
  },
  methods: {
    ...call("auth", ["fetchIsRegistered"]),
    ...call("status", ["fetchIsApproved", "fetchApprobationVotes"]),
  },
};
</script>

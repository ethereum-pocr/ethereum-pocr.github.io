<template>
  <div>Status Page. Registered: {{ registered }}</div>
</template>

<script>
import { get, call } from "vuex-pathify";

export default {
  computed: {
    ...get("auth", ["registered"]),
  },
  mounted() {
    this.fetchIsRegistered();
  },
  methods: {
    ...call("auth", ["fetchIsRegistered"]),
  },
};
</script>

<template>
  <div>
    <div v-for="log of logs" :key="log.key">
      <v-chip>{{log.type}}</v-chip> {{log.args.map(a=>typeof a=="object"?"OBJ":a).join(' ')}}
    </div>
  </div>
</template>

<script>
import { get } from "vuex-pathify";

export default {
  data: () => ({}),
  computed: {
    ...get(["logs"]),
  },

  mounted() {
  },
  methods: {
    
  },
};
</script>

<template>
  <v-icon small color="blue" @click="open(url)">mdi-open-in-new</v-icon>
</template>

<script>
import $store from "@/store";

export default {
  props: {
    id: [String, Number],
    type: { 
      type: String,
      validator(value) {
        // The value must match one of these strings
        return ['block', 'tx', 'token', 'account'].includes(value)
      }
    },
  },

  computed: {
    url() {
      let explorerUrl = $store.get("auth/explorerUrl");
      if (!explorerUrl) return undefined;
      while (explorerUrl.endsWith('/')) explorerUrl = explorerUrl.slice(0, explorerUrl.length-1)
      const u = new URL(`${this.type}/${this.id}`, `${explorerUrl}/`)
      return u.href;
    }
  },

  methods: {
    open(url) {
      window.open(url, 'POCR-EXPLORER')
    }
  }
}
</script>

<style>

</style>
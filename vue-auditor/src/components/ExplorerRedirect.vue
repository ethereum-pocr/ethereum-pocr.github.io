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
      const explorerUrl = $store.get("auth/explorerUrl");
      if (!explorerUrl) return undefined;
      const u = new URL(`${explorerUrl}/${this.type}/${this.id}`)
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
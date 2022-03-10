<template>
  <div>
    
    <v-overlay z-index="100" opacity="0.8" :value="loginInError">
      <v-alert
        :value="loginInError"
        border="left"
        color="red"
        dismissible
        elevation="3"
        type="error"
        transition="slide-y-transition"
        >
        <p>An error arose that prevents the login to complete: </p>
        <p class="overline">{{lastErrorMessage}}.</p>
        <p>Check your network connection and refresh the page.</p>
      </v-alert
    >
    
    </v-overlay>
    <v-card class="ma-10">
      <v-card-title>Authentication</v-card-title>
      <!-- div with the specific 'login-buttons' id that will be populated with the next line script -->
      <v-card-actions>
        <v-row v-if="displayLoginButtons">
          <v-col cols="4">
            <div id="login-buttons"></div>
          </v-col>
        </v-row>
        <v-row v-if="userIdentity != null">
          <v-col cols="4">
            
          </v-col>
        </v-row>
      </v-card-actions>

    </v-card>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { } from "../lib/api";

export default {
  async mounted() {
    this.cleanTrusteeScripts();
    this.applyTrussteeScript();
  },
  data: ()=>({
    userIdentity: null,
    displayLoginButtons: true,

    loginInError: false,
    lastErrorMessage: ""

  }),
  computed: {
    
  },
  methods: {
    ...mapActions(["applyUserIdentity", "applyUserOauth2Tokens"]),
    cleanTrusteeScripts() {
      let e = document.getElementById("trusstee-base-script")
      if (e) e.remove();
      e = document.getElementById("trusstee-button-script")
      if (e) e.remove();
      e = document.getElementById("trusstee-stylesheet")
      if (e) e.remove();
    },
    applyTrussteeScript() {
      let script = document.createElement("script")
      script.id = "trusstee-base-script";
      script.async = true
      script.src = "https://trusstee.io/ui/scripts.min.js"
      script.onload = ()=>{
        console.log("Script Loaded");
        this.ready()
      }
      document.head.appendChild(script);

      script = document.createElement("script")
      script.id = "trusstee-button-script";
      script.async = true
      script.src = "https://trusstee.io/ui/client/bf96b738-483a-4b00-8147-5bad2acf06ac/login-buttons"

      document.head.appendChild(script);

      const style = document.createElement("link")
      style.id = "trusstee-stylesheet";
      style.rel = "stylesheet"
      style.href = "https://trusstee.io/login-buttons-default.css"
      document.head.appendChild(style);
    },
    async ready() {
      try {
        const config = await window.Trusstee.createConfiguration("https://trusstee.io/broker", /* client_id = */"bf96b738-483a-4b00-8147-5bad2acf06ac");
        console.log("config:", config)
        const tokens = await window.Trusstee.handleAuthorizationCodeCallback.promise(config);
        console.log("Tokens", tokens);

        if (!tokens) {
          this.displayLoginButtons = true;
          // the below call will simplify the setting of a 'querystring' attribute in the 'login-buttons' div for configuring PKCE authentication
          // PKCE authentication is a mechanism to secure a OpenID Connect via the browser only: https://medium.com/identity-beyond-borders/what-the-heck-is-pkce-40662e801a76
          window.Trusstee.prepareLoginButtonsForPKCE({
            redirect_uri: window.location.origin,
            scope: "openid broker.read",
            state: ""
          })
        } else { // successfull authentication
          this.displayLoginButtons = false;
          await this.applyUserIdentity(tokens.id_token_decoded);
          await this.applyUserOauth2Tokens(tokens);
          this.userIdentity = tokens.id_token_decoded;
      
        }
      } catch (error) {
        console.error("fail handling callback", error);
        this.loginInError = true;
        this.lastErrorMessage = error.message || error.toString()
      }
    }
  }
}
</script>

<style>

</style>
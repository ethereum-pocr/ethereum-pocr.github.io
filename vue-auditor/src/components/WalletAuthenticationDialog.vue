<template>
  <v-dialog
    v-model="display"
    width="500"
    persistent
  >
    <v-card>
      <v-card-title>Transaction authentication</v-card-title>
      <v-card-text>
        Enter the password for the wallet {{ walletAddress }} :
        <v-text-field type="password" v-model="walletPassword" />
        <div style="color: red">{{ errorMessage }}</div>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="cancel">Cancel</v-btn>
        <v-btn
          @click="submit"
          :loading="loading"
          :disabled="walletPassword === '' || loading"
        >
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {

  data: () => ({
    walletAddress: null,
    errorMessage: null,
    display: false,
    loading: false,
    walletPassword: "",
    // functions as a data fields to be called by the component
    submit: ()=>{}, 
    cancel: ()=>{}
  }),

  methods: {
    /** This method is to be registered in the central store to be passed into the 
     * new Web3CustodyFunctionProvider(provider, custody, wallet, <here>)
     * to allow user to interact with the authentication process
     */
    async authenticate(address, api) {
      if (!address || !api) throw new Error("Invalid call to the authenticate function, missing parameters");
      this.walletAddress = address;
      this.display = true;

      try {
        // console.log("authenticate function with api",address, api);
        // create a promise to wait for the user interactions
        // the body of the promise links two functions (submit and cancel) to the component to receive 
        // the click events
        const token = await new Promise( (resolve, reject)=>{
          // function to receive the submit click event
          async function submit() {
            if (this.walletAddress && this.walletPassword) {
              this.loading = true;
              try {
                // calls the api to get the token
                const token = await api.authenticate(this.walletAddress, this.walletPassword);
                if (!token) throw new Error("Missing token from authenticate without real error") // should not happen
                // returns the authentication token
                resolve(token);
              } catch (error) {
                this.errorMessage = error.message;
              } finally {
                this.loading = false;
              }
            } else {
              reject(new Error("No wallet address or password"))
            }
          }
          // function to receive the cancel click event
          function cancel() {
            reject(new Error("Authentication cancelled by user"));
          }
          // link the functions to the component (using data instead of methods works fine :-) )
          this.submit = submit.bind(this);
          this.cancel = cancel.bind(this);
        });

        // returns the token obtained from the promise
        return token;
      } finally {
        // in case of exception, we should clear the fields and close the dialog
        this.walletPassword = "";
        this.errorMessage = null;
        this.display = false;
      }

    }
  },
};
</script>
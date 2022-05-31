import { getContractInstance } from "./api";

export function setupAuthNavigationGuard(router, store) {
  router.beforeEach(async (to, from, next) => {
    console.log("routing ", from.name, to.name);
    // first need to control if we have not routed to the metamask missing page
    if (to.name === "installMetaMask") {
      return next();
    }

    // Having a provider is considered mandatory. We'll check that you installed Metamask or have a wallet custody configured.
    if (!store.state.auth.providerModel) {
      console.log("no auth provider yet");
      await store.dispatch("auth/detectProvider");
      console.log("Didn't find any provider in the app, trying to detect one. Provider found?", store.state.auth.providerModel, store.state.auth.provider);
      if (store.state.auth.providerModel == "both") return next({ name: "authentication" });
      // if no provider was available, assume that no direct provider was possible hence we need at least to have metamask
      if (!store.state.auth.provider) return next({ name: "installMetaMask" });
    }

    // Just to make sure, if you do not have the smart contract instance yet, we instanciate it.
    if (!store.state.auth.contract) {
      store.commit("auth/contract", getContractInstance())
    }

    // You're going to a non-auth route, keep going.
    if (!to.meta || !to.meta.restricted) return next();

    // Good, you have the provider. But have you connected a wallet?
    if (!store.state.auth.wallet) {
      console.log("Didn't find the wallet in the app. Trying to fetch it...");
      const address = await store.dispatch("auth/attemptToConnectWallet");
    
      console.log("Found a connected wallet.", address);
    }

    // await store.dispatch("auth/fetchRole", null, { root: true });

    // Alright, you have the extension, and you've connected a wallet. But do you have the right to
    // go where you're trying to go?
    if (!to.meta.restricted({ store })) {
      // Maybe we don't know it yet but you're actually approved (first navigation). We double-check,
      // to avoid sending you back to status on first navigation (that would be quite annoying)
      console.log("Didn't find the proper authorizations to go to this route. Checking again with the smart contract...")
      await Promise.all([
        store.dispatch("auth/fetchIsRegistered"),
        store.dispatch("status/fetchIsApproved"),
        store.dispatch("auth/fetchRole")
      ]);
      // You're actually NOT approved or registered at all. Go back to Status, you shouldn't try to go
      // anywhere else.
      if (!to.meta.restricted({ store })) return next({ name: to.meta.forceRedirectTo });
      console.log("Found the proper authorizations.");
    }

    // Alright, if you managed to go this far, everything's fine.
    return next();
  })
}
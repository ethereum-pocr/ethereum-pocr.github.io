import { getContractInstance } from "./api";

export function setupAuthNavigationGuard(router, store) {
  router.beforeEach(async (to, from, next) => {

    // You're going to a non-auth route, keep going.
    if (to.name === "installMetaMask") return next();
    if (to.name === "auth") return next();

    // Oh, you're trying to go somewhere where being connected to metamask is important, uh?
    // If that's the case, we'll check you actually installed the extension.
    if (!store.state.auth.provider) {
      await store.dispatch("auth/detectProvider");
      console.log("Didn't find any provider in the app, trying to detect one. Provider found?", store.state.auth.provider);
      if (!store.state.auth.provider) return next({ name: "installMetaMask" });
    }

    // Good, you have the extension. But have you connected a wallet?
    if (!store.state.auth.wallet) {
      console.log("Didn't find the wallet in the app. Trying to fetch it...");
      const address = await store.dispatch("auth/attemptToConnectWallet");
      if (!address) {
        console.log("Didn't find it. Redirecting to auth.");
        return next({ name: "auth" });
      }
      console.log("Found a connected wallet.");
    }

    // Just to make sure, if you do not have the smart contract instance yet, we instanciate it.
    if (!store.state.auth.contract) {
      store.commit("auth/contract", getContractInstance())
    }

    // Alright, you have the extension, and you've connected a wallet. But do you have the right to
    // go where you're trying to go?
    if ((!store.state.auth.registered || !store.state.status.approved) && to.name !== "status") {
      // Maybe we don't know it yet but you're actually approved (first navigation). We double-check,
      // to avoid sending you back to status on first navigation (that would be quite annoying)
      console.log("Didn't find the proper authorizations to go to this route. Checking again with the smart contract...")
      await Promise.all([
        store.dispatch("auth/fetchIsRegistered"),
        store.dispatch("status/fetchIsApproved")
      ]);
      // You're actually NOT approved or registered at all. Go back to Status, you shouldn't try to go
      // anywhere else.
      if (!store.state.auth.registered || !store.state.status.approved) return next({ name: "status" });
      console.log("Found the proper authorizations.");
    }

    // Alright, if you managed to go this far, everything's fine.
    // console.log("Everything's fine, going to", to.name);
    return next();
  })
}
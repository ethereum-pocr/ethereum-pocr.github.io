import { getContractInstance } from "./api";

export function setupAuthNavigationGuard(router, store) {
  router.beforeEach(async (to, from, next) => {
    if (to.name === "installMetaMask") return next();
    if (to.name === "auth") return next();

    console.log("Routing to", to.name, "provider found?", store.state.auth.provider);
    if (!store.state.auth.provider) {
      await store.dispatch("auth/detectProvider");
      console.log("Didn't find at first, tried to detect. Provider found?", store.state.auth.provider);
      if (!store.state.auth.provider) return next({ name: "installMetaMask" });
    }

    if (!store.state.auth.wallet) {
      console.log("Didn't find the wallet. Trying to fetch it...");
      const address = await store.dispatch("auth/attemptToConnectWallet");
      if (!address) {
        console.log("Didn't find it. Redirecting to auth.");
        return next({ name: "auth" });
      }
    }

    if (!store.state.auth.contract) {
      store.commit("auth/contract", getContractInstance())
    }

    console.log("Everything's fine, going to", to.name);
    return next();
  })
}

export function setupAuthNavigationGuard(router, store) {
  router.beforeEach((to, from, next) => {
    if (to.name === "installMetaMask") return next();
    if (to.name === "auth") return next();

    if (!store.state.auth.provider) return next({ name: "installMetaMask" });
    // if (to.name === "auth") {
    //   // Uncomment this line and edit it to set the proper authentication check in place
    //   if (store.state.auth.user !== null) return next({ name: "wallets" });
    //   return next();
    // }
    // // Uncomment this line and edit it to set the proper authentication check in place
    // if (store.state.auth.user === null) return next({ name: "auth" });
    console.log(from, to, store);
    return next();
  })
}
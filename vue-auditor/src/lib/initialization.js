
export function setupAuthNavigationGuard(router, store) {
  router.beforeEach(async (to, from, next) => {
    console.log(from.name,"--->", to.name , store.state.initialized, store.state.auth.providerModel)
    if (to.name == "welcome") return next();
    if (to.name == "logs") return next();
    if (!store.state.initialized) return next({name:"welcome"})

    
    try {
      if (to.name == "installMetaMask") return next();
      if (store.state.auth.providerModel == "none") return next({name:"installMetaMask"});
      if (to.name == "authentication") return next();
      if (store.state.auth.providerModel == "both") return next({name:"authentication"});
      if (store.state.auth.providerModel == "switchMetamask") return next({name:"installMetaMask"});
      
      // You're going to a non-auth route, keep going.
      if (!to.meta || typeof to.meta.restricted !== "function") return next();
      // check that the current connected user has the right to go there
      if (!to.meta.restricted({ store })) return next({ name: to.meta.forceRedirectTo || "dashboard" });

      console.log(from.name,"--->", to.name, "ends") 
      return next()
    } catch (error) {
        console.error("Something happened when routing from "+from.name+" to "+to.name, error.message)
        return next({name:"welcome"})
    }
  })
}

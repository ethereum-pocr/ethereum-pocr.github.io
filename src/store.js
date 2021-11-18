import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

import { setAccessToken } from "./lib/api";
import { refreshAccessToken, silentRelogin, popupLogin } from "./lib/oauth2";

const store = new Vuex.Store({
  state: {
    userIdentity: null,
    serviceToken: "service-token",
    oauth2Tokens: null,
    activePage: "dashboard",
    tokenRefreshTimer: null,
  },
  mutations: {
    setUserIdentity(state, identity) {
      state.userIdentity = identity;
    },
    setActivePage(state, page) {
      state.activePage = page;
    },
    setOauth2Tokens(state, tokens) {
      state.serviceToken = tokens.access_token;
      state.oauth2Tokens = tokens;
    },
    setTokenRefreshTimer(state, timer) {
      // ensure there is a single timer at any time
      if (state.tokenRefreshTimer) clearTimeout(state.tokenRefreshTimer);
      state.tokenRefreshTimer = timer;
    },
  },
  actions: {
    async applyUserIdentity({ commit }, identity) {
      commit("setUserIdentity", identity);
    },
    async applyUserOauth2Tokens({ commit, dispatch }, tokens) {
      setAccessToken(tokens.access_token);
      commit("setOauth2Tokens", tokens);

      const timer = setTimeout(async () => {
        await dispatch("refreshAccessToken");
      }, (tokens.expires_in - 10) * 1000);
      commit("setTokenRefreshTimer", timer);
    },
    async refreshAccessToken({state, dispatch}, redirect = true) {
      const tokens = state.oauth2Tokens;
      if (!tokens) return;
      const refreshToken = tokens.refresh_token;
      if (!refreshToken) return;
      let newTokens;
      try {
        newTokens = await refreshAccessToken(refreshToken);
        console.log("Token refreshed", newTokens);
      } catch (error) {
        console.warn(
          "Fail refreshing the authentication. Trying iframe silent login",
          error
        );
        try {
          newTokens = await silentRelogin(tokens.origin_issuer);
          console.log("Token re login", newTokens);
        } catch (error) {
          console.warn(
            "Fail silently updating the authentication. Trying popup login",
            error
          );
          try {
            newTokens = await popupLogin(tokens.origin_issuer);
            console.log("Token popup login", newTokens);
          } catch (error) {
            console.error(
              "Fail updating the authentication in a popup",
              error
            );
          }
        }
      }
      if (newTokens) {
        newTokens.refresh_token = refreshToken;
        await dispatch("applyUserOauth2Tokens", newTokens);
      } else {
        if (redirect) {
          window.location = window.location.href;
        } else {
          throw new Error("Fail to connect to the IDP");
        }
      }
    },
    async goToPage({ commit, state }, page) {
      if (state.activePage !== page) {
        commit("setActivePage", page);
      }
    },
    
  },
  getters: {
    activePage(state) {
      return state.activePage;
    },
    userIdentity(state) {
      if (state.userIdentity) {
        return {
          email: state.userIdentity.email,
          name: state.userIdentity.name,
        };
      } else
        return {
          email: "",
          name: "",
        };
    },
    userAccessToken(state) {
      return state.serviceToken;
    },
    authenticated(state) {
      return !!state.oauth2Tokens;
    }
  },
});
export default store;
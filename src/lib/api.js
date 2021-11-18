import {  } from "@saturn-chain/wallet-custody-rest-api";
import {  } from "@saturn-chain/dlt-tx-data-functions";
import {  } from "@saturn-chain/smart-contract";
import {  } from "@saturn-chain/web3-custody-functions";
// import { toNumber, toGWei, toWei } from "./numbers";

let currentAccessToken;
export function setAccessToken(token) {
  currentAccessToken = token;
  console.log("To be removed when currentAccessToken is used", currentAccessToken);
}
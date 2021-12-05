import {  } from "@saturn-chain/wallet-custody-rest-api";
import {  } from "@saturn-chain/dlt-tx-data-functions";
import {  } from "@saturn-chain/smart-contract";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import Web3 from "web3";
// import { BlockHeader } from "web3-eth";
// import { Subscription } from "web3-core-subscriptions";
import CarbonFootprintContracts from "sc-carbon-footprint";
import { poaBlockHashToSealerInfo } from "pocr-utils";
// import { toNumber, toGWei, toWei } from "./numbers";

let currentAccessToken;
export function setAccessToken(token) {
  currentAccessToken = token;
  console.log("To be removed when currentAccessToken is used", currentAccessToken);
}

function getWeb3ProviderUrl() {
  const pageUrl = new URL(window.location.href);
  let url = "wss://saturn-pocr-3.francecentral.cloudapp.azure.com/ws"
  if (pageUrl.searchParams.has("url")) {
    try {
      url = new URL(pageUrl.searchParams.get("url")).href
    } catch (error) {
      console.warn("the url provided in the query string is not valid")
    }
  }
  return url;
}

const carbonFootprint = CarbonFootprintContracts.get("CarbonFootprint").at("0000000000000000000000000000000000000100")

let web3;
let intf;

function initConnection() {
  web3 = new Web3(getWeb3ProviderUrl());
  intf = new Web3FunctionProvider(web3.currentProvider, ()=>web3.eth.getCoinbase());
}
initConnection();

/** @type Subscription<BlockHeader> */
let _blockSubscription;

/**
 * @returns Subscription<BlockHeader>
 */
function blockSubscription(reset) {
  if (!_blockSubscription || reset) {
    if (reset) {
      initConnection();
    }
    if(reset && _blockSubscription) {
      try { _blockSubscription.unsubscribe() } catch (error) { console.warn("could not unsubscribe");}
    }
    try {
      // console.log("Creating the new subscription")
      _blockSubscription = web3.eth.subscribe("newBlockHeaders")
      _blockSubscription.on("connected", id=>console.log("Block subscription connected with id", id))
    } catch (error) {
      console.warn("cannot open subscription", error)
      return undefined;      
    }
  }
  return _blockSubscription
}

function normalRewardForFootprint(footprint, totalFootprint, nbNodes) {
  if (footprint <= 0) return 0;
  if (nbNodes == 0) return 0;
  if (totalFootprint <= 0) return 0;
  try {
    return ((totalFootprint*1e+9)/(footprint*nbNodes) - 6e+8)/1e+9;
  } catch (error) {
    return 0;
  }
}

export async function processBlock(block) {
  // console.log("Receiving block", block.number)
  const data = {block, sealer:undefined}
  try {
    if (typeof block.difficulty === "string" && !block.difficulty.startsWith('0x')) block.difficulty = Number.parseInt(block.difficulty);
    data.sealer = poaBlockHashToSealerInfo(block);
    const blockNumber = typeof block.number==="string" ? Number.parseInt(block.number) : block.number;
    // const balanceB4 = web3.utils.toBN(await web3.eth.getBalance(data.sealer.address, blockNumber-1))
    const balance = web3.utils.toBN(await web3.eth.getBalance(data.sealer.address, blockNumber))
    const bal = Number.parseFloat(web3.utils.fromWei(balance, "ether"))
    // const delta = Number.parseFloat(web3.utils.fromWei(balance.sub(balanceB4)));
    const footprint = await carbonFootprint.footprint(intf.call(), data.sealer.address)
    const totalFootprint = await carbonFootprint.totalFootprint(intf.call())
    const nbNodes = await carbonFootprint.nbNodes(intf.call())
    data.sealer.footprint = Number.parseFloat(footprint);
    data.sealer.balance = bal
    data.totalFootprint = Number.parseInt(totalFootprint)
    data.nbNodes = Number.parseInt(nbNodes)
    data.sealer.lastReward = normalRewardForFootprint(data.sealer.footprint, data.totalFootprint, data.nbNodes);
    data.receivedAt = Date.now()
  } catch (error) {
    console.warn("Error in preparing block", error)
  }
  return data;
}

let lastBlockNumner = undefined;
export function onNewBlock(callMe) {
  const sub = blockSubscription(false);
  if (typeof callMe !== "function") throw new Error("provide a valid function as a callback");

  let autoResetIfNoNewBlockAfter10Sec = true

  if (sub) {
    sub.on("data", async block=>{
      autoResetIfNoNewBlockAfter10Sec = false;
      lastBlockNumner = block.number;
      
      const data = await processBlock(block);
      try {
        callMe(data)
      } catch (error) {
        console.warn("Error in calling block callback", error)
      }
    });
  }

  const _resetTimer = setInterval(async ()=>{
    // console.log("Timer control loop", autoResetIfNoNewBlockAfter10Sec, lastBlockNumner)
    if(autoResetIfNoNewBlockAfter10Sec) {
      blockSubscription(true);
      clearInterval(_resetTimer);
      try {
        const currentBlock = await currentBlockNumber();
        await blockRange(lastBlockNumner+1, currentBlock, callMe);
      } catch (error) {
        console.warn("Could not reach the node waiting one more time")
      }
      onNewBlock(callMe);
    } else {
      autoResetIfNoNewBlockAfter10Sec = true;
    }
  }, 10*1000)
}

export async function currentBlockNumber() {
  return await web3.eth.getBlockNumber()
}

export async function blockRange(from, to, callMe) {
  for (let index = from; index <= to; index++) {
    const block = await web3.eth.getBlock(index, false);
    processBlock(block).then(callMe)
  }
}
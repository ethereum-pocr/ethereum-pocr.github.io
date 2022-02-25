import Web3 from "web3";
import { JSONRPCBlockDetail, poaBlockHashToSealerInfo } from "../src/index";
import CarbonFootprintContracts from "sc-carbon-footprint";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";

const web3 = new Web3("wss://saturn-pocr-1.uksouth.cloudapp.azure.com/ws");
const intf = new Web3FunctionProvider(web3.currentProvider, ()=>web3.eth.getCoinbase())
const carbonFootprint = CarbonFootprintContracts.get("CarbonFootprint").at("0000000000000000000000000000000000000100")


const sub = web3.eth.subscribe("newBlockHeaders", async (err, header) =>{
  if (err) {
    console.error("Error detected", err)
    process.exit(1)
  }

  // console.log("Header", header)
  const details = header as any as JSONRPCBlockDetail
  if (typeof details.difficulty === "string" && !details.difficulty.startsWith('0x')) details.difficulty = Number.parseInt(details.difficulty)
  const sealer = poaBlockHashToSealerInfo(details)
  // console.log("Sealer", sealer)
  const block = typeof details.number==="string" ? Number.parseInt(details.number) : details.number;
  const balanceB4 = web3.utils.toBN(await web3.eth.getBalance(sealer.address, block-1))
  const balance = web3.utils.toBN(await web3.eth.getBalance(sealer.address, block))
  const bal: number = Number.parseFloat(web3.utils.fromWei(balance, "ether"))
  const delta: number = Number.parseFloat(web3.utils.fromWei(balance.sub(balanceB4)));
  const footprint = await carbonFootprint.footprint(intf.call(), sealer.address)
  const totalFootprint = await carbonFootprint.totalFootprint(intf.call())

  console.log(`${block}: ${sealer.address} (${sealer.vanity.custom}). Footprint:${footprint}/${totalFootprint}. Balance ${bal.toFixed(4)} --> +${delta.toFixed(4)}`)
})
sub.on("error", (err)=>{
  console.error("Error detected", err)
    process.exit(1)
})
sub.on("changed", console.log)
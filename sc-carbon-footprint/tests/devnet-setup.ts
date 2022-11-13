import Web3 from "web3";
import { Crypto, EthProviderInterface } from "@saturn-chain/dlt-tx-data-functions";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";

import allContracts from "../contracts";

async function run() {
  const Contract = allContracts.get("Governance");
  const instance = Contract.at("0x0000000000000000000000000000000000000100");
  const web3 = new Web3("http://localhost:8502");
  const mainWallet: string = "0x3d0a5f7514906c02178c6ce5c4ec33256f08ce58";
  const node1Wallet = "0x6E45c195E12D7FE5e02059F15d59c2c976A9b730";
  const node2Wallet = "0x926eD993bF6A57306a7dC5eF2f6C2053DA42F85C";
  const node3Wallet = "0xCda0bd40e7325f519F31BB3F31F68bc7d4C78903";
  const main : EthProviderInterface = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(mainWallet));

  const registered = await instance.auditorRegistered(main.call(), mainWallet);
  if (!registered) {
    const maxGas = await instance.selfRegisterAuditor(main.test());
    await instance.selfRegisterAuditor(main.send({maxGas}));
  }
  for (const wallet of [node1Wallet, node2Wallet, node3Wallet]) {
    let minPledge = BigInt(await instance.minPledgeAmountToAuditNode(main.call(), mainWallet));
    let pledged = BigInt(await instance.pledgedAmount(main.call(), mainWallet));
    if (pledged<minPledge) {
      console.log("Pledging an additional", minPledge-pledged, "wei");
      await instance.pledge(main.send({maxGas: 200000, amount: minPledge-pledged}));
    }
    const maxGas = await instance.setFootprint(main.test(), wallet, 1000);
    if (wallet == node3Wallet) {
      //
    } else {
      await instance.setFootprint(main.send({maxGas}), wallet, 1000 + Math.floor(Math.random() * 100));
    }
    const nbNodes = await instance.nbNodes(main.call())
    const footprint = await instance.footprint(main.call(), wallet)
    const totalFootprint = await instance.totalFootprint(main.call())
    console.log("Footprint situation", {wallet, footprint, nbNodes, totalFootprint});
    
  }
}


run().catch(console.error);
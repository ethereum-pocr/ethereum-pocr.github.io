import Web3 from "web3";
import { Crypto, EthProviderInterface } from "@saturn-chain/dlt-tx-data-functions";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";

import allContracts from "../contracts";

async function run() {
  const Contract = allContracts.get("Governance");
  const instance = Contract.at("0x0000000000000000000000000000000000000100");
  const web3 = new Web3("http://localhost:8502");
  const mainWallet: string = "0xCda0bd40e7325f519F31BB3F31F68bc7d4C78903";
  const node1Wallet = "0x6E45c195E12D7FE5e02059F15d59c2c976A9b730";
  const node2Wallet = "0x926eD993bF6A57306a7dC5eF2f6C2053DA42F85C";
  const main : EthProviderInterface = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(mainWallet));

  const registered = await instance.auditorRegistered(main.call(), mainWallet);
  if (!registered) {
    await instance.selfRegisterAuditor(main.send({maxGas:140000}));
  }
  for (const wallet of [node1Wallet, node2Wallet]) {
    let minPledge = BigInt(await instance.minPledgeAmountToAuditNode(main.call(), mainWallet));
    let pledged = BigInt(await instance.pledgedAmount(main.call(), mainWallet));
    if (pledged<minPledge) {
      console.log("Pledging an additional", minPledge-pledged, "wei");
      await instance.pledge(main.send({maxGas: 100000, amount: minPledge-pledged}));
    }
    await instance.setFootprint(main.send({maxGas:300000}), wallet, 1000);
  }
}


run().catch(console.error);
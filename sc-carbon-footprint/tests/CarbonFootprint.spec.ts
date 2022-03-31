import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import Web3 from "web3";
import { EthProviderInterface } from "@saturn-chain/dlt-tx-data-functions";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import {
  EventReceiver,
  SmartContract,
  SmartContractInstance,
  SmartContracts,
} from "@saturn-chain/smart-contract";
import Ganache from "ganache-core";

import allContracts from "../contracts";

const CarbonFootprintName = "CarbonFootprint";

describe("Run tests on a CarbonFootprint", function () {
  this.timeout(10000);
  let web3: Web3;
  let wallet: string;
  let CarbonFootprint: SmartContract;
  let instance: SmartContractInstance;
  let intf: EthProviderInterface;
  before(async () => {
    web3 = new Web3(Ganache.provider() as any);
    intf = new Web3FunctionProvider(web3.currentProvider, (list) =>
      Promise.resolve(list[0])
    );
    wallet = await intf.account();
    if (allContracts.get(CarbonFootprintName)) {
      CarbonFootprint = allContracts.get(CarbonFootprintName)!;
      instance = await CarbonFootprint.deploy(intf.newi({ maxGas: 3000000 }));
    } else {
      throw new Error(CarbonFootprintName+" contract not defined in the compilation result");
    }
  });


  it('should set a footprint for an address', async () => {
    await instance.setFootprint(intf.send({maxGas: 90000}), wallet, 1000)
    const footprint = await instance.footprint(intf.call(), wallet)
    expect(footprint).to.equal('1000')
  });


  it('extract the runtime code for the genesis block', async () => {
    const code = await web3.eth.getCode(instance.deployedAt)
    console.log("CODE for the genesis block:")
    console.log(code)
  });

});
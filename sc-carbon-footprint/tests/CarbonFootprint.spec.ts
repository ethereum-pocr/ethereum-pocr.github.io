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


  it("should create 1 node and set the variable nbNodes to 1", async () => {

    await instance.setFootprint(intf.send({maxGas: 900000}), "0xa4916c63a9bcf5D71Fa0e5C5466c2E2A9a82f9c2", 1000);

    const nbnodes = await instance.nbNodes(intf.call());

    expect(nbnodes).to.equal('1')

  });


  it("should create 2 nodes and set the variable nbNodes to 2", async () => {

    await instance.setFootprint(intf.send({maxGas: 900000}), "0x756d3eD4e67346680063388fc2a1FcC06B225c08", 1000);
    await instance.setFootprint(intf.send({maxGas: 900000}), "0xa4916c63a9bcf5D71Fa0e5C5466c2E2A9a82f9c2", 1000);

    const nbnodes = await instance.nbNodes(intf.call());

    expect(nbnodes).to.equal('2')

  });


  it("should create 3 nodes and calculate the total totalFootprint", async () => {

    await instance.setFootprint(intf.send({maxGas: 900000}), "0x756d3eD4e67346680063388fc2a1FcC06B225c08", 25);
    await instance.setFootprint(intf.send({maxGas: 900000}), "0xa4916c63a9bcf5D71Fa0e5C5466c2E2A9a82f9c2", 10);
    await instance.setFootprint(intf.send({maxGas: 900000}), "0x93CD4C4956C6493722f344e7715C2e4AD139D307", 37);

    const totalfootprint = await instance.totalFootprint(intf.call());

    expect(totalfootprint).to.equal('72')

  });


  it("should create 2 nodes and modify the footprint of the first node", async () => {

    await instance.setFootprint(intf.send({maxGas: 900000}), "0x756d3eD4e67346680063388fc2a1FcC06B225c08", 25);
    await instance.setFootprint(intf.send({maxGas: 900000}), "0xa4916c63a9bcf5D71Fa0e5C5466c2E2A9a82f9c2", 10);
    await instance.setFootprint(intf.send({maxGas: 900000}), "0x756d3eD4e67346680063388fc2a1FcC06B225c08", 37);

    const footprint = await instance.footprint(intf.call(),"0x756d3eD4e67346680063388fc2a1FcC06B225c08");

    expect(footprint).to.equal('37')

  });


    /*

  it("should revert because an address can not set its own footprint", async () =>  {

    await instance.setFootprint(intf.send({maxGas: 900000}), wallet, 2517);


    //await expect(instance.setFootprint(intf.send({maxGas: 900000}), wallet, 2517)).to.be;
    


  });

 
  


    it("should generate an event if a node is created", async () =>  {

        const CarbonFootprintInstance = await CarbonFootprint.new();

        let tx = await CarbonFootprintInstance.setFootprint("0x756d3eD4e67346680063388fc2a1FcC06B225c08","25", { from: accounts[0] });

        truffleAssert.eventEmitted(tx, 'CarbonFootprintUpdate', (ev) => {
            

            return ev.node == "0x756d3eD4e67346680063388fc2a1FcC06B225c08" && ev.footprint == "25";

        });
    })


    it("should generate an event if a node is updated", async () =>  {

        const CarbonFootprintInstance = await CarbonFootprint.new();

        await CarbonFootprintInstance.setFootprint("0x756d3eD4e67346680063388fc2a1FcC06B225c08","25", { from: accounts[0] });
        
        await CarbonFootprintInstance.setFootprint("0xa4916c63a9bcf5D71Fa0e5C5466c2E2A9a82f9c2","10", { from: accounts[0] });

        let tx = await CarbonFootprintInstance.setFootprint("0x756d3eD4e67346680063388fc2a1FcC06B225c08","47", { from: accounts[0] });

        truffleAssert.eventEmitted(tx, 'CarbonFootprintUpdate', (ev) => {
            
            return ev.node == "0x756d3eD4e67346680063388fc2a1FcC06B225c08" && ev.footprint == "47";

        });
    })




    it("should generate an event if a node is deleted", async () =>  {

        const CarbonFootprintInstance = await CarbonFootprint.new();

        await CarbonFootprintInstance.setFootprint("0x756d3eD4e67346680063388fc2a1FcC06B225c08","25", { from: accounts[0] });

        let tx = await CarbonFootprintInstance.setFootprint("0x756d3eD4e67346680063388fc2a1FcC06B225c08","0", { from: accounts[0] });

        truffleAssert.eventEmitted(tx, 'CarbonFootprintUpdate', (ev) => {
            
            return ev.node == "0x756d3eD4e67346680063388fc2a1FcC06B225c08" && ev.footprint == "0";

        });
    })

    */



  it('extract the runtime code for the genesis block', async () => {
    const code = await web3.eth.getCode(instance.deployedAt)
    console.log("CODE for the genesis block:")
    console.log(code)
  });




});
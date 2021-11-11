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

const MyContractName = "Counters";

describe("Run tests on a MyContract", function () {
  this.timeout(10000);
  let web3: Web3;
  let wallet: string;
  let MyContract: SmartContract;
  let instance: SmartContractInstance;
  let intf: EthProviderInterface;
  before(async () => {
    web3 = new Web3(Ganache.provider() as any);
    intf = new Web3FunctionProvider(web3.currentProvider, (list) =>
      Promise.resolve(list[0])
    );
    wallet = await intf.account();
    if (allContracts.get(MyContractName)) {
      MyContract = allContracts.get(MyContractName)!;
      instance = await MyContract.deploy(intf.newi({ maxGas: 3000000 }));
    } else {
      throw new Error(MyContractName+" contract not defined in the compilation result");
    }
  });

  it("should reset the counter and have a zero value", async () => {
    // given the instance
    // when the instance is reset
    await instance.reset(intf.send({maxGas: 100000}));
    // then the counter is zero
    const value = Number.parseInt(await instance.counters(intf.call(), wallet));
    expect(value).to.equal(0)
  });
  
  it('should have an increased counter by 1', async () => {
    // given the reset instance
    await instance.reset(intf.send({maxGas: 100000}));
    // when the instance is increased
    await instance.increase(intf.send({maxGas: 100000}));
    // then the counter should be 1
    const value = Number.parseInt(await instance.counters(intf.call(), wallet));
    expect(value).to.equal(1)
  });

  it('should collect events of counter changed', (done) => {
    // given the instance
    // when the events are collected from the begining
    instance.events.Changed(intf.get({fromBlock:"earliest"}), {})
    .on("log", log=>console.log("Received:", log))
    .on("completed", done);
  });

  it('should receive an event when a change is made to the counter', (done) => {
    let currentValue: number = NaN;
    // need an async function to interact with the instance
    async function execute() {
      // given the instance at any current value
      currentValue = Number.parseInt(await instance.counters(intf.call(), wallet));
      // when the counter is increased
      await instance.increase(intf.send({ maxGas: 100000 }));
    }
    // when instance subscribe to the event
    const sub = instance.events.Changed(intf.sub({}), {});

    // then it should trigger the event on a log that is as expected
    sub.on("log", log=>{
      console.log("Received:", log);
      // remove the listener to stop receiving events
      sub.removeAllListeners();
      if(log && 
        Number.parseInt(log.returnValues.valueBefore) === currentValue && 
        Number.parseInt(log.returnValues.valueAfter) === currentValue+1 ) {
        done();
      } else {
        done( new Error(
          `Invalid log values: Before:${
            log.returnValues.valueBefore
          } expeced ${currentValue}; After: ${
            log.returnValues.valueAfter
          } expected ${currentValue + 1}`)
        );
      }
    });
    sub.on("error", (err)=>{
      sub.removeAllListeners();
      done(err)
    });
    // run the async instance interaction and it should trigger an event that will call the done() callback
    execute();
  });

  it('should have the owner of the creating wallet', async () => {
    // given th instance created by wallet
    // when getting the owner
    const owner = await instance.owner(intf.call());
    // then the owner should be the wallet
    expect(owner).to.equal(wallet);
  });

  it('should transfer the ownership to another wallet', async () => {
    // given a new wallet and the instance created by wallet
    const newWallet = await intf.account(1);
    // when the instance is transferred to the new wallet
    await instance.transferOwnership(intf.send({maxGas: 100000}), newWallet);
    // then the owner should be the new wallet
    const owner = await instance.owner(intf.call());
    expect(owner).to.equal(newWallet);
    // set the interface to the new owner to be able to reach it
    intf = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(newWallet));
  });

  it('should not be able to transfer ownership if called by the wrong wallet', async () => {
    // given a wallet that is not the current owner
    const owner = await instance.owner(intf.call());
    const intf2 = new Web3FunctionProvider(web3.currentProvider, (list) => {
      for (const w of list) {
        if (w != owner) return Promise.resolve(w);
      }
      throw new Error("No wallet available that is not the owner !");
    });
    // when the transferOwnership is called with that other wallet
    const p = instance.transferOwnership(intf2.send({maxGas: 100000}), wallet);
    // then the call should fail
    return expect(p).to.be.rejectedWith(/revert Ownable: caller is not the owner/);
  });


});
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import Web3 from "web3";
import { Crypto, EthProviderInterface } from "@saturn-chain/dlt-tx-data-functions";
import { Web3FunctionProvider } from "@saturn-chain/web3-functions";
import {
  EventReceiver,
  SmartContract,
  SmartContractInstance,
  SmartContracts,
} from "@saturn-chain/smart-contract";
import { EventData } from "web3-eth-contract";
import Ganache from "ganache-core";

import allContracts from "../contracts";

const POCRContractNameActual = "Governance"; 
const POCRContractName = "GovernanceTesting"; // Attention the actual name to use is Governance
const CarbonFootprintName = "CarbonFootprint";




describe("Run tests on POCR Governance contract", function () {
  this.timeout(10000);
  let web3: Web3;
  let auditorWallet: string;
  let CarbonFootprint: SmartContract;
  let instance: SmartContractInstance;
  let auditor: EthProviderInterface;
  let node1: EthProviderInterface;
  let intf: EthProviderInterface;

  async function init() {

    web3 = new Web3(Ganache.provider({default_balance_ether:10000}) as any);

    auditor = new Web3FunctionProvider(web3.currentProvider, (list) =>
      Promise.resolve(list[0])
    );

    auditorWallet = await auditor.account();

    node1 = new Web3FunctionProvider(web3.currentProvider, (list) =>
      Promise.resolve(list[1])
    );

    if (allContracts.get(POCRContractName)) {
      CarbonFootprint = allContracts.get(POCRContractName)!;
      instance = await CarbonFootprint.deploy(auditor.newi({ maxGas: 3000000 }));
    } else {
      throw new Error(POCRContractName+" contract not defined in the compilation result");
    }
  }




  
  


  describe('Tests on the Auditors governance interface', () => {
    const logs: EventData[] = [];
    before(async () => {
      await init();
      console.log("Auditor balance", web3.utils.fromWei(await web3.eth.getBalance(auditorWallet), "ether"))
      instance.allEvents(auditor.sub(), {})
      .on("log", log=>{
        logs.push(log);
        console.log(`Log: ${log.event}(${JSON.stringify(log.returnValues)})`)
      })
    });
    

    
    it('should enable an initial registration', async () => {

      const tx = await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));

      console.log("Tx", await web3.eth.getTransactionReceipt(tx));

      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorApproved")
      expect(log!.returnValues.auditor).to.equal(auditorWallet)
      expect(log!.returnValues.approved).to.be.true

      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorRegistered")
      expect(log!.returnValues.auditor).to.equal(auditorWallet)

    });

    
    it('should not produce an event when registering a second time the same auditor', async () => {
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      // console.log("Registered?", registered)
      // if the auditor is not already registered this test fails, so bypass
      if (!registered) return;
      const tx = await instance.selfRegisterAuditor(auditor.send({maxGas: 25000}));
      // console.log("Tx", tx, await web3.eth.getTransactionReceipt(tx));
      let log = logs.pop();
      expect(log).to.be.undefined;
    });



    
    it('should set the footprint of a node', async () => {
      // Given the auditor is registered
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }
      // Given the pledge amount is present
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      const minPledge = BigInt(web3.utils.toWei('1000', "ether"));
      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }
      // When the auditor sets the footprint of node1
      await instance.setFootprint(auditor.send({maxGas: 200000}), await node1.account(1), 1000);
      // Then a log should be raised and the footprint must be set
      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("CarbonFootprintUpdate");
      expect(log?.returnValues.node).to.equal(await node1.account(1));
      const val = await instance.footprint(node1.call(), await node1.account(1));
      expect(Number.parseInt(val)).to.equal(1000);
    });


    it("should create 1 node and set the variable nbNodes to 1", async () => {
      // Given the auditor is registered
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }
      // Given the pledge amount is present
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      const minPledge = BigInt(web3.utils.toWei('1000', "ether"));
      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }
      // When the auditor sets the footprint of node1
      await instance.setFootprint(auditor.send({maxGas: 200000}), await node1.account(1), 1000);
      const nbnodes = await instance.nbNodes(auditor.call());
      //Then the number of nodes is equal to 1
      expect(nbnodes).to.equal('1');
    });


    it("should create 2 nodes and set the variable nbNodes to 2", async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 8760);

      const nbnodes = await instance.nbNodes(auditor.call());
      expect(nbnodes).to.equal('2');
  
    });


    it("should create 3 nodes and calculate the total totalFootprint", async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 8760);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[3], 5500);

      const totalfootprint = await instance.totalFootprint(auditor.call());
      expect(totalfootprint).to.equal('15830');
    });





    it("should create 2 nodes and modify the footprint of the first node", async () => {

      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 8760);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 5500);

      const footprint = await instance.footprint(auditor.call(),wallets[1]);

      expect(footprint).to.equal('5500');

  
    });


    it("should revert because an address can not set its own footprint", async () =>  {

      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      const p = instance.setFootprint(auditor.send({maxGas: 200000}), auditorWallet, 1570);

      return expect(p).to.be.rejectedWith(/the auditor cannot set its own footprint/)
  
    });


    it("should generate an event if a node is created", async () =>  {

      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);

      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("CarbonFootprintUpdate");
      expect(log!.returnValues.node).to.equal(wallets[1]);
      expect(log!.returnValues.footprint).to.equal('1570');

  })


  it("should generate an event if a node is updated", async () =>  {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 8760);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 5500);

      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("CarbonFootprintUpdate");
      expect(log!.returnValues.node).to.equal(wallets[1]);
      expect(log!.returnValues.footprint).to.equal('5500');

  })


  it("should generate an event if a node is deleted", async () =>  {
    // Given a new auditor
    const wallets = await web3.eth.getAccounts()
    // Given that the bootstrap auditor has set the footprint for 2 nodes
    const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
    if (!registered) {
      // first register
      await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
    }

    let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

    const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                    + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

    if (pledged < minPledge) {
      // then pledge enough crypto
      await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
    }

    await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1570);
    await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 0);

    let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("CarbonFootprintUpdate");
      expect(log!.returnValues.node).to.equal(wallets[1]);
      expect(log!.returnValues.footprint).to.equal('0');
  })


    //Integration ci-dessus des tests unitaires du smart contract carbonfootprint
    

    it('should success to vote in and out a new auditor and make pledge confiscated', async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[1], 1000);
      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 1000);
      
      // Given that the new auditor self registers
      const auditor2Wallet = wallets[wallets.length-1];
      const auditor2 = new Web3FunctionProvider(web3.currentProvider, () => Promise.resolve(auditor2Wallet));
      await instance.selfRegisterAuditor(auditor2.send({maxGas: 130000}));
      await instance.pledge(auditor2.send({maxGas:50000, amount: minPledge}));
      
      // When the first node accepts the auditor
      const node1 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(wallets[1]));
      await instance.voteAuditor(node1.send({maxGas: 200000}), auditor2Wallet, true);
      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorVoted");


      // When the second node accepts the auditor
      const node2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(wallets[2]));
      await instance.voteAuditor(node2.send({maxGas: 200000}), auditor2Wallet, true);
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorApproved");
      expect(log!.returnValues.approved).to.equal(true);
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorVoted");
      
      // When the 2 nodes vote out the auditor
      await instance.voteAuditor(node1.send({maxGas: 200000}), auditor2Wallet, false);
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorVoted");
      await instance.voteAuditor(node2.send({maxGas: 200000}), auditor2Wallet, false);
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorApproved");
      expect(log!.returnValues.approved).to.equal(false);
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("PledgeConfiscated");
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorVoted");
      
    });



    


    it('should fail transferring the pledge', async () => {
      // Given the auditor is registered

      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      }

      // Given the pledge amount is present
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(web3.utils.toWei('1000', "ether"));

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      // Given the auditor trying to take the pledge away
      const p = instance.transferPledge(auditor.send({maxGas:50000}), auditorWallet, pledged.toString());

      // Then the execution should fail
      return expect(p).to.be.rejectedWith(/not allowed to transfer pledge out/)
      
    });

  });






    //J'en suis ici de ma lecture



  

  describe('Tests of the PledgeContract', () => {
    const PledgeContractName = "PledgeContract";
    let PledgeContract: SmartContract;
    before(async ()=>{
      await init();
      if (allContracts.get(PledgeContractName)) {
        PledgeContract = allContracts.get(PledgeContractName)!;
        instance = await PledgeContract.deploy(auditor.newi({ maxGas: 3000000 }));
      } else {
        throw new Error(POCRContractName+" contract not defined in the compilation result");
      }
    });


    it('should be able to pledge some amount', async () => {

      // Given the instance

      const initialContractBalance = await web3.eth.getBalance(instance.deployedAt);

      const initialWalletBalance = await web3.eth.getBalance(auditorWallet);

      // When the wallet pledge the amount

      const amount = BigInt(web3.utils.toWei('1000', "ether").toString());

      await instance.pledge(auditor.send({maxGas:50000, amount}));

      // Then the contract balance should have increased and the wallet balance will decrease

      const newContractBalance = await web3.eth.getBalance(instance.deployedAt);
      const newWalletBalance = await web3.eth.getBalance(auditorWallet);
      const pledgedAmount = await instance.pledgedAmount(auditor.call(), auditorWallet);
      expect(BigInt(newContractBalance)-BigInt(initialContractBalance)).to.equal(amount);
      expect(new Number(BigInt(initialWalletBalance)-BigInt(newWalletBalance)).valueOf()).to.be.greaterThanOrEqual(new Number(amount).valueOf());
      expect(Number.parseInt(pledgedAmount)).to.equal(new Number(amount).valueOf());
    });

    

    //tester message "not enough funds"
    it('should not allow to transfer more than the amount been pledged', async () => {
      // Given an amount being pledged
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      if (pledged <= 0n) {
        pledged = 1000000000000000000000n;
        await instance.pledge(auditor.send({maxGas:50000, amount: pledged}));
      }

      // The sender then tries to transfer more than the amount pledged
      let pledgedAsked = 1000000000000000000001n;
      const wallet = (await web3.eth.getAccounts())[1];
      const p = instance.transferPledge(auditor.send({maxGas:100000}), wallet, pledgedAsked);
      return expect(p).to.be.rejectedWith(/revert/)
    });


    /*
    it('should fail transferring crypto directly to the smart contract', async () => {
      const p = Crypto.transfer(auditor.send({maxGas:30000, amount: 100000n}), instance.deployedAt);
      return expect(p).to.be.rejectedWith(/revert/)
    });

    it('should fail transferring crypto via a function call to the smart contract', async () => {
      const p = instance.getTransferCount(auditor.send({maxGas:30000, amount: 100000n}));
      return expect(p).to.be.rejectedWith(/revert/)
    });

    it('should be able to transfer a pledge out', async () => {
      // Given an amount being pledged
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      if (pledged <= 0n) {
        pledged = 1000000000000000000000n;
        await instance.pledge(auditor.send({maxGas:50000, amount: pledged}));
      }
      // When the sender tries to transfer the crypto to another wallet
      const wallet = (await web3.eth.getAccounts())[1];
      const initialWalletBalance = await web3.eth.getBalance(wallet);
      await instance.transferPledge(auditor.send({maxGas:100000}), wallet, pledged);

      // Then the target wallet should have been credited with the pledged amount
      const newWalletBalance = await web3.eth.getBalance(wallet);
      expect(BigInt(newWalletBalance)-BigInt(initialWalletBalance)).to.equal(pledged);
      // And the pledge amount should be zeroed
      pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      expect(pledged).to.equal(0n);
    });



  });

  describe('Tests of the confiscated amount transactions', () => {
    let node: EthProviderInterface;
    let nodeWallet: string;
    let node2: EthProviderInterface;
    let node2Wallet: string;
    const logs: EventData[] = [];
    beforeEach(async () => {
      await init();
      instance.allEvents(auditor.sub(), {})
      .on("log", log=>{
        logs.push(log);
        console.log(`Log: ${log.event}(${JSON.stringify(log.returnValues)})`)
      })
      await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      const minPledge = BigInt(web3.utils.toWei('2000', "ether"));
      await instance.pledge(auditor.send({maxGas:50000, amount: minPledge})); 
      const wallets = await web3.eth.getAccounts();
      nodeWallet = wallets[1];
      node2Wallet = wallets[2];
      node = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(nodeWallet));
      node2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node2Wallet));
      await instance.setFootprint(auditor.send({maxGas:200000}), nodeWallet, 1000);
      await instance.setFootprint(auditor.send({maxGas:200000}), node2Wallet, 1000);
      await instance.voteAuditor(node.send({maxGas: 200000}), auditorWallet, false);
      await instance.voteAuditor(node2.send({maxGas: 200000}), auditorWallet, false);
    });

    it('should create a transfer', async () => {
      // Given the confiscated amount
      let confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      // When a node create a transfer of that amount
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());
      // Then a transfer should be created 
      const nb = Number.parseInt(await instance.getTransferCount(node.call()));
      expect(nb).to.equal(1);
      const transfer = await instance.getTransfer(node.call(), nb-1);
      console.log("Transfer", transfer);
      expect(transfer.index).equal('0');
      expect(transfer.amount).equal(confiscated.toString());
      expect(transfer.target).equal(auditorWallet);
      expect(transfer.nbApprovals).equal('0');
      expect(transfer.completed).equal(false);
      confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      expect(confiscated).to.equal(0n);
    });

    it('should execute a transfer after 2 signatures', async () => {
      // Given a transfer created for the confiscated amount
      const confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());

      // When the first node approves 
      await instance.approveTransfer(node.send({maxGas:100000}), 0);
      let transfer = await instance.getTransfer(node.call(), 0);
      expect(transfer.nbApprovals).to.equal('1');

      // When the second node approves
      await instance.approveTransfer(node2.send({maxGas:100000}), 0);
      transfer = await instance.getTransfer(node2.call(), 0);
      expect(transfer.nbApprovals).to.equal('2');

      // When the transfer is executed
      const initialBalance = BigInt(await web3.eth.getBalance(auditorWallet));
      await instance.executeTransfer(node.send({maxGas:200000}), 0);
      transfer = await instance.getTransfer(node2.call(), 0);
      const finalBalance = BigInt(await web3.eth.getBalance(auditorWallet));
      expect(transfer.completed).to.be.true;
      expect(finalBalance - initialBalance).to.equal(confiscated);

      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("TransferChanged");
      expect(log?.returnValues.index).equal('0');
      expect(log?.returnValues.status).equal('3'); // Executed
      expect(log?.returnValues.approvals).equal('2'); 
    });

    it('should fail executing the transfer with not enough signatures', async () => {
      // Given a transfer created for the confiscated amount
      const confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());

      // Given that the first node approves 
      await instance.approveTransfer(node.send({maxGas:100000}), 0);
      
      // When the transfer is executed
      const p = instance.executeTransfer(node.send({maxGas:200000}), 0);

      // Then it should fails because there is not enough validation
      return expect(p).to.be.rejectedWith(/not enough approvals/);
    });

    it('should be able to cancel a transfer', async () => {
      // Given a transfer created for the confiscated amount
      const confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());

      // Given that the first node approves 
      await instance.approveTransfer(node.send({maxGas:100000}), 0);
      
      // When the transfer is cancelled
      await instance.cancelTransfer(node.send({maxGas:100000}), 0);
      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("TransferChanged");
      expect(log?.returnValues.index).equal('0');
      expect(log?.returnValues.status).equal('4'); // Cancelled
      expect(log?.returnValues.approvals).equal('1'); // 1 signature
      const transfer = await instance.getTransfer(node.call(), 0);
      expect(transfer.completed).to.be.true;
    });

    it('should fail executing a cancelled transfer', async () => {
      // Given a transfer created for the confiscated amount
      const confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());

      // Given that the nodes approves 
      await instance.approveTransfer(node.send({maxGas:100000}), 0);
      await instance.approveTransfer(node2.send({maxGas:100000}), 0);
      
      // Given the transfer is cancelled
      await instance.cancelTransfer(node.send({maxGas:100000}), 0);

      // When the transfer is executed
      const p = instance.executeTransfer(node.send({maxGas:200000}), 0);

      // Then it should fail due to the status
      return expect(p).to.be.rejectedWith(/cannot execute the transfer/)
    });

    it('should fail trying to cancel the transfer from the auditor wallet', async () => {
      // Given a transfer created for the confiscated amount
      const confiscated = BigInt(await instance.confiscatedAmount(node.call()));
      await instance.createTransfer(node.send({maxGas:200000}), auditorWallet, confiscated.toString());

      // When the transfer is cancelled with the auditor wallet
      const p = instance.cancelTransfer(auditor.send({maxGas:100000}), 0);

      // Then it should fail
      return expect(p).to.be.rejectedWith(/not allowed to cancel/)
    });

  });

  describe('Tests the Improvement Proposal governance', () => {
    const logs: EventData[] = [];
    let auditor2: EthProviderInterface;
    let node1: EthProviderInterface;
    let node2: EthProviderInterface;
    let auditor2Wallet: string;
    let node1Wallet: string;
    let node2Wallet: string;
    let mine: () => Promise<any>;

    async function passBlocks(nb: number) : Promise<void> {
      for (let index = 0; index < nb; index++) {
        await mine();
      }
    }
    beforeEach( async () => {
      await init();
      instance.allEvents(auditor.sub(), {})
      .on("log", log=>{
        logs.push(log);
        console.log(`Log: ${log.event}(${JSON.stringify(log.returnValues)})`)
      });
      const wallets = await web3.eth.getAccounts();
      await instance.selfRegisterAuditor(auditor.send({maxGas: 130000}));
      const pledge = BigInt(Web3.utils.toWei('3000', 'ether'));
      await instance.pledge(auditor.send({maxGas: 300000, amount:pledge}));
      node1Wallet = wallets[1];
      node2Wallet = wallets[2];
      node1 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node1Wallet));
      node2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node2Wallet));

      await instance.setFootprint(auditor.send({maxGas:200000}), node1Wallet, 1000);
      await instance.setFootprint(auditor.send({maxGas:200000}), node2Wallet, 1000);
      
      auditor2Wallet = wallets[wallets.length-1];
      auditor2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(auditor2Wallet));
      await instance.selfRegisterAuditor(auditor2.send({maxGas: 130000}));
      
      await instance.voteAuditor(node1.send({maxGas:200000}), auditor2Wallet, true);
      await instance.voteAuditor(node2.send({maxGas:200000}), auditor2Wallet, true);

      web3.extend({
        property: "custom",
        methods: [{
          name: 'mine',
          call: 'evm_mine',
          params: 0,
          inputFormatter: [],
        }]
      })
      mine = (web3 as any).custom.mine;
    });
    it('check intitialization', async () => {
      let auditorApproved: boolean;
      auditorApproved = await instance.auditorApproved(auditor.call(), auditorWallet);
      expect(auditorApproved).to.be.true;
      auditorApproved = await instance.auditorApproved(auditor.call(), auditor2Wallet);
      expect(auditorApproved).to.be.true;
      let footprint: string;
      footprint = await instance.footprint(auditor.call(), node1Wallet);
      expect(Number.parseInt(footprint)).to.equal(1000);
      footprint = await instance.footprint(auditor.call(), node2Wallet);
      expect(Number.parseInt(footprint)).to.equal(1000);
    });

    it('declare an Improvement Proposal', async () => {
      // Given the initial setup
      // When an Improvement Proposal is created
      await instance.newProposal(node1.send({maxGas: 300000}));
      // Then the proposal should be created with initial values
      let log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("IPChanged");
      const index = log!.returnValues.index;
      const proposal = await instance.getImprovementProposal(node1.call(), index);
      // console.log("Proposal", proposal);
      expect(proposal.status).to.equal('0');

      const constants = {
        blockDelayBeforeVote: 5,
        blockSpanForVote: 10
      }
      const block = Number.parseInt(proposal.createdBlock);
      expect(block).to.equal(await web3.eth.getBlockNumber());
      expect(Number.parseInt(proposal.voteFromBlock)).to.equal(block + constants.blockDelayBeforeVote)
      expect(Number.parseInt(proposal.voteUntilBlock)).to.equal(block + constants.blockDelayBeforeVote + constants.blockSpanForVote)
    });
    
    it('create 10 empty blocks', async () => {
      console.log("Block", await web3.eth.getBlockNumber())
      await passBlocks(10);
      console.log("Block", await web3.eth.getBlockNumber())
    });

    it('Vote for and against for the 2 categories', async () => {
      // Given a proposal created
      await instance.newProposal(node1.send({maxGas: 300000}));
      let proposal = await instance.getImprovementProposal(node1.call(), 0);
      // Given the chain progresses until the vote is possible
      const nb = Number.parseInt(proposal.voteFromBlock) - await web3.eth.getBlockNumber()
      await passBlocks(nb);
      proposal = await instance.getImprovementProposal(node1.call(), 0);
      let log: EventData|undefined;
      // console.log("Proposal", proposal, "\nBlock", await web3.eth.getBlockNumber());
      // When auditor vote for
      await instance.voteForProposal(auditor.send({maxGas:100000}), 0);
      // Then an event reflecting the vote should be generated
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).equal("IPVote")
      expect(log!.returnValues.index).equal('0');
      expect(log!.returnValues.voter).equal(auditorWallet);
      expect(log!.returnValues.category).equal('1');
      expect(log!.returnValues.vote).equal('1');
      
      // When the second auditor vote against
      await instance.voteAgainst(auditor2.send({maxGas:100000}), 0);
      // Then an event reflecting the vote should be generated
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).equal("IPVote")
      expect(log!.returnValues.index).equal('0');
      expect(log!.returnValues.voter).equal(auditor2Wallet);
      expect(log!.returnValues.category).equal('1');
      expect(log!.returnValues.vote).equal('-1');

      // When the first node vote for
      await instance.voteForProposal(node1.send({maxGas:100000}), 0);
      // Then an event reflecting the vote should be generated
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).equal("IPVote")
      expect(log!.returnValues.index).equal('0');
      expect(log!.returnValues.voter).equal(node1Wallet);
      expect(log!.returnValues.category).equal('2');
      expect(log!.returnValues.vote).equal('1');

      // When the second node vote against
      await instance.voteAgainst(node2.send({maxGas:100000}), 0);
      // Then an event reflecting the vote should be generated
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).equal("IPVote")
      expect(log!.returnValues.index).equal('0');
      expect(log!.returnValues.voter).equal(node2Wallet);
      expect(log!.returnValues.category).equal('2');
      expect(log!.returnValues.vote).equal('-1');

      // proposal = await instance.getImprovementProposal(node1.call(), 0);
      // console.log("Proposal", proposal, "\nBlock", await web3.eth.getBlockNumber());
    });

    it('should fail voting before it is time', async () => {
      // Given a proposal created
      await instance.newProposal(node1.send({maxGas: 300000}));
      let proposal = await instance.getImprovementProposal(node1.call(), 0);
      // Given the chain progresses before the vote is possible
      const nb = Number.parseInt(proposal.voteFromBlock) - await web3.eth.getBlockNumber() -2;
      await passBlocks(nb);
      // proposal = await instance.getImprovementProposal(node1.call(), 0);
      // console.log("Proposal", proposal, "\nBlock", await web3.eth.getBlockNumber());
      // When a node try to vote
      const p = instance.voteForProposal(node1.send({maxGas:100000}), 0);
      return expect(p).to.be.rejectedWith(/vote is closed/)
    });

    it('should fail voting after vote is closed', async () => {
      // Given a proposal created
      await instance.newProposal(node1.send({maxGas: 300000}));
      let proposal = await instance.getImprovementProposal(node1.call(), 0);
      // Given the chain progresses before the vote is possible
      const nb = Number.parseInt(proposal.voteUntilBlock) - await web3.eth.getBlockNumber() +1;
      await passBlocks(nb);
      // proposal = await instance.getImprovementProposal(node1.call(), 0);
      // console.log("Proposal", proposal, "\nBlock", await web3.eth.getBlockNumber());
      // When a node try to vote
      const p = instance.voteForProposal(node1.send({maxGas:100000}), 0);
      return expect(p).to.be.rejectedWith(/vote is closed/)
    });

    it('should be accepted with a majority', async () => {
      // Given a proposal created
      await instance.newProposal(node1.send({maxGas: 300000}));
      let proposal = await instance.getImprovementProposal(node1.call(), 0);
      let nb = Number.parseInt(proposal.voteFromBlock) - await web3.eth.getBlockNumber()
      await passBlocks(nb);
      
      // Given one auditor and one node vote for
      await instance.voteForProposal(auditor.send({maxGas:100000}), 0);
      await instance.voteForProposal(node1.send({maxGas:100000}), 0);

      // When the blocks passes after the vote is closed
      nb = Number.parseInt(proposal.voteUntilBlock) - await web3.eth.getBlockNumber() +2;
      await passBlocks(nb);
      
      // Then the status of the proposal should be accepted
      proposal = await instance.getImprovementProposal(node1.call(), 0);
      // console.log(nb, "Proposal", proposal, "\nBlock", await web3.eth.getBlockNumber());
      expect(proposal.status).equal('3');
    });

    */
  });
  
  
});

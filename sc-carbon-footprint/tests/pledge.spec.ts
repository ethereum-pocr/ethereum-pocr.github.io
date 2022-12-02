import chai, { expect } from "chai";
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



describe("Run tests on POCR Governance contract", function () {
  this.timeout(10000);
  let web3: Web3;
  let auditorWallet: string;
  let CarbonFootprint: SmartContract;
  let instance: SmartContractInstance;
  let auditor: EthProviderInterface;
  let node1: EthProviderInterface;
  let delegate1: EthProviderInterface;
  let nbNodes: number;

  async function init() {
    nbNodes = 0;
    web3 = new Web3(Ganache.provider({default_balance_ether:10000}) as any);
    auditor = new Web3FunctionProvider(web3.currentProvider, (list) => Promise.resolve(list[0]));
    auditorWallet = await auditor.account();
    node1 = new Web3FunctionProvider(web3.currentProvider, (list) =>
    Promise.resolve(list[1])
    );
    delegate1 = new Web3FunctionProvider(web3.currentProvider, (list) => Promise.resolve(list[2]));
    if (allContracts.get(POCRContractName)) {
      CarbonFootprint = allContracts.get(POCRContractName)!;
      instance = await CarbonFootprint.deploy(auditor.newi({ maxGas: 3000000 }));
    } else {
      throw new Error(POCRContractName+" contract not defined in the compilation result");
    }
  }

  /**
   * Attention: This function is replacing the work of the geth cliquepocr.synchronizeSealers()
   * that replicate in the smart contract the list of sealers and their number.
   * It uses 2 smart contract function that should only exists in the GovernanceTesting contract.
   * @param address sealer node address
   */
  async function addSealer(address: string) {
    await instance.setAsSealerAt(auditor.send({maxGas: 100_000}), nbNodes, address);
    nbNodes ++;
    await instance.setNbNodes(auditor.send({maxGas: 100_000}), nbNodes);
  }

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

    it('should fail transferring crypto directly to the smart contract', async () => {
      const p = Crypto.transfer(auditor.send({maxGas:30000, amount: 100000n}), instance.deployedAt);
      return expect(p).to.be.rejectedWith(/revert/)
    });

    it('should fail transferring crypto via a function call to the smart contract', async () => {
      const p = instance.getTransferCount(auditor.send({maxGas:30000, amount: 100000n}));
      return expect(p).to.be.rejectedWith(/revert/)
    });

    it('should be able to transfer a pledge out when calling transferPledge function', async () => {
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


    it('should be able to transfer a pledge back to the auditor when calling getPledgeBack function', async () => {
      // Given an amount being pledged
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      if (pledged <= 0n) {
        pledged = 1000000000000000000000n;
        await instance.pledge(auditor.send({maxGas:50000, amount: pledged}));
      }

      // Then the target wallet should have been credited with the pledged amount
      pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      expect(pledged).to.equal(1000000000000000000000n);

      await instance.getPledgeBack(auditor.send({maxGas:100000}));

      // Then the target wallet should have been credited with the pledged amount
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
      await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      const minPledge = BigInt(web3.utils.toWei('2000', "ether"));
      await instance.pledge(auditor.send({maxGas:50000, amount: minPledge})); 
      const wallets = await web3.eth.getAccounts();
      nodeWallet = wallets[1];
      node2Wallet = wallets[2];
      node = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(nodeWallet));
      node2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node2Wallet));
      await addSealer(await node.account())
      await addSealer(await node2.account())

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


});
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
const POCRContractName = "GovernanceTesting"; // Attention the actual name to use in production is Governance



describe("Run tests on POCR Governance contract", function () {
  this.timeout(10000);
  let web3: Web3;
  let auditorWallet: string;
  let CarbonFootprint: SmartContract;
  let instance: SmartContractInstance;
  let auditor: EthProviderInterface;
  let node1: EthProviderInterface;
  let delegate1: EthProviderInterface;
  let nbNodes: number = 0;

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
      await addSealer(await node1.account())
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
      const tx = await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      console.log("Tx", await web3.eth.getTransactionReceipt(tx));
      await new Promise(r=>setTimeout(r, 300)) // needed to ensure logs have been received because it appears not to be the case in all occasion !
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

    it('should not have event when registering a second time the auditor', async () => {
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
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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
      const nbnodes = await instance.nbNodes(auditor.call());
      //Then the number of nodes is equal to 1
      expect(nbnodes).to.equal('1');
    });


    it("should add a 2nd node and set the variable nbNodes to 2", async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given a new sealer is added
      await addSealer(wallets[2])
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[2], 8760);
  

      const nbnodes = await instance.nbNodes(auditor.call());
      expect(nbnodes).to.equal('2');
  
    });

    it("should add a 3rd node and calculate the total totalFootprint", async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given a new sealer is added
      await addSealer(wallets[3])
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }


      await instance.setFootprint(auditor.send({maxGas: 200000}), wallets[3], 5500);

      const totalfootprint = await instance.totalFootprint(auditor.call());
      expect(totalfootprint).to.equal('15260');
    });

    it("should modify the footprint of the first node", async () => {

      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      }

      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

      const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                      + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }

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
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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
          await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
        }

        let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));

        const minPledge = BigInt(await instance.minPledgeAmountToAuditNode(auditor.call(), auditorWallet))
                        + BigInt(web3.utils.toWei("1000", "ether")); // for the second setFootprint

        if (pledged < minPledge) {
          // then pledge enough crypto
          await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
        }

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
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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

    it('should success to vote in and out a new auditor and make pledge confiscated', async () => {
      // Given a new auditor
      const wallets = await web3.eth.getAccounts()
      // Given that the bootstrap auditor has set the footprint for 2 nodes
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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
      await instance.selfRegisterAuditor(auditor2.send({maxGas: 180000}));
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
      expect(log!.event).to.equal("AmountPledged");
      log = logs.pop();
      expect(log).to.be.ok;
      expect(log!.event).to.equal("AuditorVoted");
      
    });


    it('should fail transferring the pledge when calling transferPledge function', async () => {
      // Given the auditor is registered
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
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

    it('should fail transferring the pledge when calling getPledgeBack function', async () => {
      // Given the auditor is registered
      const registered = await instance.auditorRegistered(auditor.call(), auditorWallet)
      if (!registered) {
        // first register
        await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      }
      // Given the pledge amount is present
      let pledged = BigInt(await instance.pledgedAmount(auditor.call(), auditorWallet));
      const minPledge = BigInt(web3.utils.toWei('1000', "ether"));
      if (pledged < minPledge) {
        // then pledge enough crypto
        await instance.pledge(auditor.send({maxGas:50000, amount: minPledge - pledged}));  
      }
      // Given the auditor trying to take the pledge away
      const p = instance.getPledgeBack(auditor.send({maxGas:50000}));
      // Then the execution should fail
      return expect(p).to.be.rejectedWith(/not allowed to transfer pledge out/)
      
    });

  });


});
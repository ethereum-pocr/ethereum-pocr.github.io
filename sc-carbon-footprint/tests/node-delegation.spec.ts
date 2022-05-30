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

  async function init() {
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


  describe('Test the Node Delegation scheme', () => {
    beforeEach(async () => {
      await init();

    });
    it('should record a delegate, check and remove', async () => {
      // Given the governance instance
      // Given the node is knwon but not necessarilly audited with a footprint
      // When the node adds a delegate
      await instance.allowDelegate(node1.send({maxGas: 100000}), await delegate1.account());
      // Then delegate to be added
      let nodeAddress = await instance.delegateOf(delegate1.call(), await delegate1.account());
      let isDelegated = await instance.isDelegateOf(delegate1.call(), await node1.account(), await delegate1.account());
      expect(nodeAddress).to.equal(await node1.account());
      expect(isDelegated).to.be.true;
      
      // When the delegate is removed
      await instance.removeDelegate(node1.send({maxGas:100000}), await delegate1.account());
      // Then the delegation should be removed
      nodeAddress = await instance.delegateOf(delegate1.call(), await delegate1.account());
      isDelegated = await instance.isDelegateOf(delegate1.call(), await node1.account(), await delegate1.account());
      expect(nodeAddress).to.equal("0x0000000000000000000000000000000000000000");
      expect(isDelegated).to.be.false;
    });
    it('should not be able to map a delegate to 2 different addresses', async () => {
      // Given the governance instance
      // Given the node is knwon but not necessarilly audited with a footprint
      // Given the node delegate to an address already
      await instance.allowDelegate(node1.send({maxGas: 100000}), await delegate1.account());
      // When another node tries to add the same delegate
      const p = instance.allowDelegate(auditor.send({maxGas: 100000}), await delegate1.account());
      // Then it should fail with error
      return expect(p).to.be.rejectedWith(/already mapped/)
    });
    it('should not be able to remove a delegate from another owner', async () => {
      // Given the governance instance
      // Given the node is knwon but not necessarilly audited with a footprint
      // Given the node delegate to an address already
      await instance.allowDelegate(node1.send({maxGas: 100000}), await delegate1.account());
      // When another node tries to add the same delegate
      const p = instance.removeDelegate(auditor.send({maxGas: 100000}), await delegate1.account());
      // Then it should fail with error
      return expect(p).to.be.rejectedWith(/not mapped to the caller/)
    });
    async function prepareAuditor() {
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
      
    } 
    it('should be able to vote an auditor from a delegate account', async () => {
      // Given the auditor is setup
      await prepareAuditor();
      // Given the node has been audited
      await instance.setFootprint(auditor.send({maxGas:200000}), await node1.account(), 1000);
      // Given the node has added a delegate
      await instance.allowDelegate(node1.send({maxGas: 100000}), await delegate1.account());
     
      // When the delegate tries to down vote the auditor
      await instance.voteAuditor(delegate1.send({maxGas:200000}), auditorWallet, false);
      // Then the auditor must be removed
      const approved = await instance.auditorApproved(auditor.call(), auditorWallet);
      expect(approved).to.be.false;
    });

    it('should fail voting an auditor out from a delegate account of a zero footprint node', async () => {
      // Given the auditor is setup
      await prepareAuditor();
      // Given the node has been audited
      await instance.setFootprint(auditor.send({maxGas:200000}), await node1.account(), 0);
      // Given the node has added a delegate
      await instance.allowDelegate(node1.send({maxGas: 100000}), await delegate1.account());
     
      // When the delegate tries to down vote the auditor
      const p = instance.voteAuditor(delegate1.send({maxGas:200000}), auditorWallet, false);
      // Then the auditor must be removed
      return expect(p).to.be.rejectedWith(/only audited nodes which have footprint/)
    });

    it('should fail voting an auditor out from a non delegate account of a node', async () => {
      // Given the auditor is setup
      await prepareAuditor();
      // Given the node has been audited
      await instance.setFootprint(auditor.send({maxGas:200000}), await node1.account(), 1000);
      // When the delegate tries to down vote the auditor
      const p = instance.voteAuditor(delegate1.send({maxGas:200000}), auditorWallet, false);
      // Then the auditor must be removed
      return expect(p).to.be.rejectedWith(/only audited nodes which have footprint/)
    });
  });

});
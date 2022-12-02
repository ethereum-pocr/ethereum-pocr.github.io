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
      await instance.selfRegisterAuditor(auditor.send({maxGas: 180000}));
      const pledge = BigInt(Web3.utils.toWei('3000', 'ether'));
      await instance.pledge(auditor.send({maxGas: 300000, amount:pledge}));
      node1Wallet = wallets[1];
      node2Wallet = wallets[2];
      node1 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node1Wallet));
      node2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(node2Wallet));
      await addSealer(await node1.account())
      await addSealer(await node2.account())
      await instance.setFootprint(auditor.send({maxGas:200000}), node1Wallet, 1000);
      await instance.setFootprint(auditor.send({maxGas:200000}), node2Wallet, 1000);
      
      auditor2Wallet = wallets[wallets.length-1];
      auditor2 = new Web3FunctionProvider(web3.currentProvider, ()=>Promise.resolve(auditor2Wallet));
      await instance.selfRegisterAuditor(auditor2.send({maxGas: 180000}));
      
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
      await instance.voteAgainstProposal(auditor2.send({maxGas:100000}), 0);
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
      await instance.voteAgainstProposal(node2.send({maxGas:100000}), 0);
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
  });


});
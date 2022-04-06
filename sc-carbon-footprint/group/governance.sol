// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IAuditorGovernance {
  function selfRegisterAuditor() external;
  function voteAuditor(address auditor, bool accept) external;
  function auditorRegistered(address auditor) external view returns (bool);
  function auditorApproved(address auditor) external view returns (bool);
  function auditorVotes(address auditor) external view returns (uint);
  function auditorLastAuditInfo(address auditor) external view returns (uint atBlock, uint minPledge);
  function minPledgeAmountToAuditNode(address auditor) external view returns (uint);
  function auditorSettingFootprint(address auditor) external returns (bool);
  event AuditorRegistered(address indexed auditor);
  event AuditorVoted(address indexed auditor, address indexed by, bool accepted);
  event AuditorApproved(address indexed auditor, bool approved);
}

interface ICarbonFootprint {
  function setFootprint(address node, uint value) external; 
  function nbNodes() external view returns (uint);
  function totalFootprint() external view returns (uint);
  function footprint(address node) external view returns (uint);
  event CarbonFootprintUpdate(address indexed node, uint footprint);
}

contract CarbonFootprint {

    mapping(address => uint) public footprint;

    uint public nbNodes;
    
    uint public totalFootprint;

    event CarbonFootprintUpdate(address indexed node, uint footprint);


    //in final version, we should define the function external as it is intended to be used with an UI exclusively (?)
    function setFootprint(address _node, uint _value) external {
        
        // IAuditorGovernance me = IAuditorGovernance(address(this));
        // Ensure that the sender is an authorized auditor
        // require(me.auditorSettingFootprint(msg.sender), "the caller is not authorized to set the carbon footprint");
        require(msg.sender != _node, "the auditor cannot set its own footprint"); 


        // Now we can set the footprint
        uint current = footprint[_node];



        //creation of a node and footprint setting
        if ((current == 0) && (_value > 0)) {
            footprint[_node] = _value;
            nbNodes += 1;
            totalFootprint += _value;
        }

        //update of a footprint node
        if ((current > 0) && (_value > 0)) {
            footprint[_node] = _value;
            totalFootprint -= current;
            totalFootprint += _value;
        }

       //delete of a footprint node
        if ((current > 0) && (_value ==  0)) {
            totalFootprint -= current;
            nbNodes -= 1;
            delete footprint[_node];
        }

 

        emit CarbonFootprintUpdate(_node, _value);
    }

}


contract AuditorGovernance is IAuditorGovernance {

  struct NodeVote {
    bool vote;
    uint atBlock;
  }

  struct AuditorStatus {
    bool registered;
    uint votes;
    bool approved;
    uint registeredAtBlock;
    uint approvalBlock;
    mapping (address => NodeVote) voters;
    uint minPledgeAtLastAudit; // the calculated amount of the minimum pledge at last audit done
    uint lastAuditAtBlock; // the block number of the last audit done
  }

  mapping(address => AuditorStatus) private auditorsStatus;

  uint private nbAuditors;


  function selfRegisterAuditor() override public {

    AuditorStatus storage s = auditorsStatus[msg.sender];

    if (!s.registered) {      // not registered
      s.registered = true;
      s.registeredAtBlock = block.number;
      emit AuditorRegistered(msg.sender);
      if (nbAuditors == 0) {  // the first auditor is automatically approved as part of the bootstrap
        approveAuditor(msg.sender);
      } else {
        s.approved = false;
        s.votes = 0;
      }
    }
  }


  function approveAuditor(address _auditor) private {

    AuditorStatus storage s = auditorsStatus[_auditor];

    if (!s.approved) { //not approved
      s.approved = true;
      s.votes = 0;
      s.approvalBlock = block.number;
      nbAuditors ++;
      emit AuditorApproved(_auditor, true);
    }
  }


  function onAuditorRejected(address _auditor) virtual internal {

  }


  function rejectAuditor(address _auditor) private {

    AuditorStatus storage s = auditorsStatus[_auditor];

    if (s.approved) {
      s.approved = false;
      s.votes = 0;
      s.approvalBlock = block.number;
      nbAuditors --;
      onAuditorRejected(_auditor);
      emit AuditorApproved(_auditor, false);
    }
  }



  /**
  * Only a node with a footprint can vote on an auditor
  * Only an auditor registered can be voted on
  * A non approved auditor that reaches enough votes (N/2+1) becomes approved
  * An approved auditor that reaches enougth votes (N/2+1) becomes un approved
  * a node can vote in or out until the auditor change its status
  */

  function voteAuditor(address _auditor, bool _accept) override public {

    ICarbonFootprint me = ICarbonFootprint(address(this));

    AuditorStatus storage s = auditorsStatus[_auditor];

    require(me.footprint(msg.sender) > 0, "only audited nodes can vote for auditors");
    require(s.registered, "the proposed _auditor is not registered");

    

    // If the node has never voted, its lastVote.atBlock is zero
    // If the node has already voted & the auditor status has changed since the vote, its last vote was in favor of current status
    if (s.voters[msg.sender].atBlock == 0 || s.voters[msg.sender].atBlock <= s.approvalBlock) {
      // the node vote is forced to the current status to decide if the vote should change the status
      s.voters[msg.sender].vote = s.approved;
    }

    uint minVotes = me.nbNodes() / 2 + 1;

    // the vote should be the inverse of the previous vote or it shall have no effect
    if (_accept != s.voters[msg.sender].vote) {

      (s.voters[msg.sender].vote, s.voters[msg.sender].atBlock)  = (_accept, block.number);

      emit AuditorVoted(_auditor, msg.sender, _accept);

      if (!s.approved) {
        // not yet approved : accept should increase the number of votes
        if (_accept) {
          s.votes ++;
        } else {
          s.votes --;
        }

        if (auditorsStatus[_auditor].votes >= minVotes) {
          approveAuditor(_auditor);
        }

      } else {
        // already approved : accept should decrease the number of votes
        if (_accept) {
          s.votes --;
        } else {
          s.votes ++;
        }

        if (s.votes >= minVotes) {
          rejectAuditor(_auditor);
        }
      }
    }
  }


  function auditorRegistered(address _auditor) override public view returns (bool) {
    return auditorsStatus[_auditor].registered;
  }


  function auditorApproved(address _auditor) override public view returns (bool) {
    return auditorsStatus[_auditor].approved;
  }


  function auditorVotes(address _auditor) override public view returns (uint) {
    return auditorsStatus[_auditor].votes;
  }


  function auditorLastAuditInfo(address _auditor) override public view returns (uint, uint) {
    return (auditorsStatus[_auditor].lastAuditAtBlock, auditorsStatus[_auditor].minPledgeAtLastAudit);
  }


  //Review here Michael


  function minPledgeAmountToAuditNode(address _auditor) public view override returns  (uint) {

      AuditorStatus storage s = auditorsStatus[_auditor];
      uint minPledgeAtLastAudit = s.minPledgeAtLastAudit;
      uint maxNbBlockPerPeriod = 650_000;
      uint nbBlocks = block.number - s.lastAuditAtBlock;
      uint minPledge = 1000 ether;

      if ( nbBlocks < maxNbBlockPerPeriod && minPledgeAtLastAudit > 0) {
        // there is an amortisation of the previous pledge amount to be added
        //       = minPledge * (1 - nbBlocks / 650 000) + 1 000
        // eq   minPledge = 1 000 + minPledge - minPledge * nbBlocks / 650 000
        minPledge = minPledge + minPledgeAtLastAudit - (minPledgeAtLastAudit * nbBlocks / maxNbBlockPerPeriod);
      }

      return minPledge;
  }


  function auditorSettingFootprint(address _auditor) override public returns (bool) {

    IPledgeContract me = IPledgeContract(address(this));
    AuditorStatus storage s = auditorsStatus[_auditor];

    if (s.approved) { // auditor must still be approved
      if (me.pledgedAmount(_auditor) < minPledgeAmountToAuditNode(_auditor)) {
        // not enough pledge in the contract
        return false;
      } else {
        // enough pledge, save the calculation
        s.minPledgeAtLastAudit = minPledgeAmountToAuditNode(_auditor);
        s.lastAuditAtBlock = block.number;
        return true;
      }
    } else {
      return false;
    }
  }

}

interface IPledgeContract {
  function pledge() external payable;
  function pledgedAmount(address owner) external view returns (uint);
  function transferPledge(address payable target, uint amount) external returns (bool);
  event AmountPledged(address indexed from, uint amount, uint total);

  function confiscatedAmount() external view returns (uint);
  event PledgeConfiscated(address indexed from, uint amount, uint total);
  function createTransfer(address payable target, uint amount) external;
  function getTransferCount() external view returns (uint);
  function getTransfer(uint _index) external view returns (
      uint index, 
      uint amount,
      address payable target,
      uint nbApprovals,
      bool executed
    );
  function approveTransfer(uint index) external;
  function rejectTransfer(uint index) external;
  function executeTransfer(uint index) external;
  function cancelTransfer(uint index) external;
  enum TransferChangeStatus {Created, Approving, Rejecting, Executed, Cancelled}
  event TransferChanged(uint indexed index, TransferChangeStatus indexed status, uint approvals);
}

contract PledgeContract is IPledgeContract {


  uint private totalConfiscatedAmount;


  mapping (address => uint) private pledgesAmountsByAuditor;


  struct TransferTx {
    uint index;
    address payable target;
    uint amount;
    uint nbApprovals;
    mapping (address => bool) approvals;
    bool completed;
  }


  uint private nbTransfers;


  mapping (uint => TransferTx) private transfers;



  function pledge() override public payable {


    pledgesAmountsByAuditor[msg.sender] += msg.value;


    emit AmountPledged(msg.sender, msg.value, pledgesAmountsByAuditor[msg.sender]);


  }



  // reject any direct transfer without an explicit pledge
  receive() external payable {
    revert();
  }

  // reject any direct transfer to an unknown method
  fallback() external payable {
    revert();
  }
  

  function pledgedAmount(address owner) override public view returns (uint) {
    return pledgesAmountsByAuditor[owner];
  }


  function canTransferPledge(address payable, uint) virtual internal view returns (bool) {
    return true;
  }




  function transferPledge(address payable _target, uint _amount) public override returns (bool){

    require(_amount <= pledgesAmountsByAuditor[msg.sender], "not enough funds");

    // test if the sender is a registered auditor and therefore test if it can remove its pledge

    require(canTransferPledge(_target, _amount), "not allowed to transfer pledge out");
    
    pledgesAmountsByAuditor[msg.sender] -= _amount;

    _target.transfer(_amount);

    return true;

  }



  /** to be called  */
  function confiscatePledge(address _auditor) internal {

    uint amount =  pledgesAmountsByAuditor[_auditor];

    if (amount == 0) {
      return;
    }

    totalConfiscatedAmount += amount;

    pledgesAmountsByAuditor[_auditor] = 0;

    emit PledgeConfiscated(_auditor, amount, totalConfiscatedAmount);

  }




  function confiscatedAmount() override public view returns (uint) {
    return totalConfiscatedAmount;
  }


  function canSenderOperateTransfer() virtual internal view returns (bool) {
    return true;
  }


  //J'en suis ici de ma revue de code

  function createTransfer(address payable _target, uint _amount) override public {
    // who can create a transfer ?
    require(canSenderOperateTransfer(), "not allowed to create a transfer of confiscated pledge");

    // ensure there are enough confiscated amount
    require(totalConfiscatedAmount >= _amount, "not enough funds");

    TransferTx storage t = transfers[nbTransfers];
    t.index = nbTransfers ++;
    t.target = _target;
    t.amount = _amount;
    totalConfiscatedAmount -= _amount;

    // defaulted values for the following fields
    // t.nbApprovals = 0;
    // t.completed = false;
    emit TransferChanged(t.index, TransferChangeStatus.Created, 0);
  }





  function getTransferCount() override public view returns (uint) {
    return nbTransfers;
  }



  function getTransfer(uint _index) override public view returns (
      uint index, 
      uint amount,
      address payable target,
      uint nbApprovals,
      bool completed
    ) {
    require(_index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[_index];
    index = t.index;
    amount = t.amount;
    target = t.target;
    nbApprovals = t.nbApprovals;
    completed = t.completed;
  }



  function approveTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to approve a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "the transfer is already completed");
    
    if (t.approvals[msg.sender]) {
      // already approved
      return;
    } else {
      t.nbApprovals ++;
      t.approvals[msg.sender] = true;
      emit TransferChanged(t.index, TransferChangeStatus.Approving, t.nbApprovals);
    }
  }



  function rejectTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to reject a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "the transfer is already completed");

    if (t.approvals[msg.sender]) {
      // already approved
      t.nbApprovals --;
      t.approvals[msg.sender] = false;
      emit TransferChanged(t.index, TransferChangeStatus.Rejecting, t.nbApprovals);
    } else {
      return;
    }
  }



  function hasEnoughVote(uint) virtual internal view returns (bool) {
    return true;
  }



  function executeTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to execute a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "cannot execute the transfer");
    // test that the nb of approvals is greater than the number of nodes / 2 +1
    require(hasEnoughVote(t.nbApprovals), "not enough approvals");

    t.target.transfer(t.amount);
    t.completed = true;
    emit TransferChanged(t.index, TransferChangeStatus.Executed, t.nbApprovals);
  }


  
  function cancelTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to cancel a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "cannot cancel the transfer");
    
    totalConfiscatedAmount += t.amount;
    t.amount = 0;
    t.completed = true;
    emit TransferChanged(t.index, TransferChangeStatus.Cancelled, t.nbApprovals);
  }
  
}

interface IImprovementProposal {

  enum IPStatus {Proposed, VoteOpen, VoteStarted, Approved, Rejected}

  event IPChanged(uint indexed index, IPStatus indexed status);

  function newProposal() external;

  function nbImprovementProposals() external view returns (uint);

  function getImprovementProposal(uint _index) external view returns (
    uint index,
    IPStatus status,
    uint createdBlock,
    uint voteFromBlock,
    uint voteUntilBlock,
    uint auditorsFor,
    uint auditorsAgainst,
    uint nodesFor,
    uint nodesAgainst
  );

  enum SenderType {Invalid, Auditor, Node}

  event IPVote(uint indexed index, address indexed voter, SenderType category, int vote);

  function voteFor(uint index) external;
  
  function voteAgainst(uint index) external;
}

contract ImprovementProposal is IImprovementProposal {

  uint constant private _blockDelayBeforeVote = 1_950_000;

  uint constant private _blockSpanForVote = 400_000;



  //Fonction pas nécessaire
  function getBlockConstantValues() virtual internal view returns (uint blockDelayBeforeVote, uint blockSpanForVote) {

    blockDelayBeforeVote = _blockDelayBeforeVote;

    blockSpanForVote = _blockSpanForVote;

  }










  struct IP {
    uint index;
    uint createdAtBlock;
    uint nodesVoteFor;
    uint nodesVoteAgainst;
    uint auditorsVoteFor;
    uint auditorsVoteAgainst;
    mapping(address => int8) nodeVotes; // -1 ; 0 ; +1
    mapping(address => int8) auditorVotes; // -1 ; 0 ; +1
    uint firstVoteAtBlock;
  }





  mapping(uint=>IP) private ips;

  uint private nbIPs;


  //Fonction pas nécessaire
  function nbImprovementProposals() public view override returns (uint) {
    return nbIPs;
  }


  //Fonction pas utilisée
  function statusToString(IPStatus s) private pure returns (string memory) {
    bytes memory b = new bytes(1);
    b[0] = bytes1(uint8(48 + uint(s)));
    return string(b);
  }


  //Fonction simplifiée (if groupé)
  function voteAllowed(IP storage ip) internal view returns (bool) {

    IPStatus status = evaluateStatus(ip);

    //require(false, statusToString(status));

    if ((status == IPStatus.VoteOpen) || (status == IPStatus.VoteStarted)) {
      return true;
    } else {
      return false;
    }
  
  }





  function evaluateStatus(IP storage ip) private view returns (IPStatus status) {
    (uint blockDelayBeforeVote, uint blockSpanForVote) = getBlockConstantValues();
    uint voteFrom = ip.firstVoteAtBlock;

    if (voteFrom > ip.createdAtBlock) {
      voteFrom = ip.createdAtBlock + blockDelayBeforeVote;
    }

    uint voteUntil = voteFrom + blockSpanForVote;

    if (block.number < voteFrom ) { // before the vote can start
      status = IPStatus.Proposed;
    } else if (block.number <= voteUntil) { // before the vote is closed
      if (ip.auditorsVoteFor + ip.auditorsVoteAgainst + ip.nodesVoteFor + ip.nodesVoteAgainst == 0) {
        // no vote yet
        status = IPStatus.VoteOpen;
      } else {
        // some vote yet
        status = IPStatus.VoteStarted;
      }
    } else { // after the vote is closed
      if ((ip.nodesVoteFor > ip.nodesVoteAgainst) && (ip.auditorsVoteFor > ip.auditorsVoteAgainst)) {
        // a majority of both categories are for the change
        status = IPStatus.Approved;
      } else {
        // no majority
        status = IPStatus.Rejected;
      }
    }
  }





  function getImprovementProposal(uint _index) public view override returns (
    uint index,
    IPStatus status,
    uint createdBlock,
    uint voteFromBlock,
    uint voteUntilBlock,
    uint auditorsFor,
    uint auditorsAgainst,
    uint nodesFor,
    uint nodesAgainst
  ) {
    (uint blockDelayBeforeVote, uint blockSpanForVote) = getBlockConstantValues();
    require(_index < nbIPs, "invalid index");
    IP storage ip = ips[_index];
    index = ip.index;
    createdBlock = ip.createdAtBlock;

    if (ip.firstVoteAtBlock >= ip.createdAtBlock + blockDelayBeforeVote) {
      voteFromBlock = ip.firstVoteAtBlock;
    } else {
      voteFromBlock = ip.createdAtBlock + blockDelayBeforeVote;
    }

    voteUntilBlock = voteFromBlock + blockSpanForVote;
    auditorsFor = ip.auditorsVoteFor;
    auditorsAgainst = ip.auditorsVoteAgainst;
    nodesFor = ip.nodesVoteFor;
    nodesAgainst = ip.nodesVoteAgainst;

    // evaluate the status 
    status = evaluateStatus(ip);
  }




  function senderType() virtual internal view returns(SenderType) {
    return SenderType.Node;
  }



  function newProposal() public override {

    require(senderType() != SenderType.Invalid, "not allowed to create a proposal");

    IP storage ip = ips[nbIPs];
    ip.index = nbIPs ++;
    ip.createdAtBlock = block.number;

    emit IPChanged(ip.index, IPStatus.Proposed);
  }




  function voteFor(uint index) public override {

    require(index < nbIPs, "invalid index");

    IP storage ip = ips[index];

    require(voteAllowed(ip), "vote is closed");

    SenderType s = senderType();

    require(s != SenderType.Invalid, "not allowed to vote");
    
    if ( ip.firstVoteAtBlock == 0 ) {
      // first vote
      ip.firstVoteAtBlock = block.number;
      emit IPChanged(ip.index, IPStatus.VoteStarted);
    }


    if (s == SenderType.Auditor) {
      int8 currentVote = ip.auditorVotes[msg.sender];

      if (currentVote == 1) {
        // already the same vote, do nothing
        return;
      }

      if (currentVote == -1) {
        // the previous vote was against, so we invert the vote
        ip.auditorsVoteAgainst --;
        ip.auditorsVoteFor ++;
        ip.auditorVotes[msg.sender] = 1;
      }

      if (currentVote == 0) {
        // no previous vote
        ip.auditorsVoteFor ++;
        ip.auditorVotes[msg.sender] = 1;
      }
    } 

    if (s == SenderType.Node) {
      int8 currentVote = ip.nodeVotes[msg.sender];
      if (currentVote == 1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == -1) {
        // invert the vote 
        ip.nodesVoteAgainst --;
        ip.nodesVoteFor ++;
        ip.nodeVotes[msg.sender] = 1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.nodesVoteFor ++;
        ip.nodeVotes[msg.sender] = 1;
      }
    }
    emit IPVote(index, msg.sender, s, 1);
  }



  function voteAgainst(uint index) public override {

    require(index < nbIPs, "invalid index");

    IP storage ip = ips[index];

    require(voteAllowed(ip), "vote is closed");

    SenderType s = senderType();

    require(s != SenderType.Invalid, "not allowed to vote");

    if ( ip.firstVoteAtBlock == 0 ) {
      // first vote
      ip.firstVoteAtBlock = block.number;
      emit IPChanged(ip.index, IPStatus.VoteStarted);
    }

    if (s == SenderType.Auditor) {
      int8 currentVote = ip.auditorVotes[msg.sender];
      if (currentVote == -1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == 1) {
        // the previous vote was for, so we invert the vote
        ip.auditorsVoteFor --;
        ip.auditorsVoteAgainst ++;
        ip.auditorVotes[msg.sender] = -1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.auditorsVoteAgainst ++;
        ip.auditorVotes[msg.sender] = -1;
      }
    } 
    if (s == SenderType.Node) {
      int8 currentVote = ip.nodeVotes[msg.sender];
      if (currentVote == -1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == 1) {
        // invert the vote 
        ip.nodesVoteFor --;
        ip.nodesVoteAgainst ++;
        ip.nodeVotes[msg.sender] = -1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.nodesVoteAgainst ++;
        ip.nodeVotes[msg.sender] = -1;
      }
    }

    emit IPVote(index, msg.sender, s, -1);

  }
}

contract Governance is CarbonFootprint, AuditorGovernance, PledgeContract, ImprovementProposal {
  

  /** Auditor can transfer his pledge out if his last audit is more that 30 days ago */
  function canTransferPledge(address payable _auditor, uint) override internal view returns (bool) {


    // First the auditor must be approved
    if (!auditorApproved(_auditor)) {
      return false;
    }


    // Then the last audit should be less that 30 days ago
    uint minimalPeriod = 650_000; // 30 days
    uint lastAuditAtBlock;


    (lastAuditAtBlock, ) = auditorLastAuditInfo(_auditor);

    return block.number >= (lastAuditAtBlock + minimalPeriod);

  }




  /** the caller must be a node with a footprint superior to zero (means the node exists)*/
  function canSenderOperateTransfer() override internal view returns (bool) {

    uint footprint = this.footprint(msg.sender);

    return footprint > 0;

  }





  /** called when an auditor is rejected and is implemented by confiscating the pledge */
  function onAuditorRejected(address _auditor) override internal {

    confiscatePledge(_auditor);

  }






  function hasEnoughVote(uint _votes) override internal view returns (bool) {

    uint nbNodes = this.nbNodes();

    return _votes >= (nbNodes / 2 + 1);

  }





  /** called to decide is the sender is a node or an auditor, used by improvement proposal */
  function senderType() override internal view returns(SenderType) {

    if (auditorApproved(msg.sender)) {

      return SenderType.Auditor;
    }
    
    uint footprint = this.footprint(msg.sender);

    if (footprint > 0) {

      return SenderType.Node;
    }

    return SenderType.Invalid;
  }
}
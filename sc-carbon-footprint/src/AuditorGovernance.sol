// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/ICarbonFootprint.sol";
import "./intf/IAuditorGovernance.sol";
import "./intf/IPledgeContract.sol";


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
    if (auditorsStatus[msg.sender].registered) { // already registered
      return;

    } else {
      (auditorsStatus[msg.sender].registered, auditorsStatus[msg.sender].registeredAtBlock) = (true, block.number);
      emit AuditorRegistered(msg.sender);

      if (nbAuditors == 0) {
        // the first auditor is automatically approved as part of the bootstrap
        approveAuditor(msg.sender);
        
      } else {
        (auditorsStatus[msg.sender].approved, auditorsStatus[msg.sender].votes)  = (false, 0);
      }
    }
  }


  function approveAuditor(address auditor) private {
    AuditorStatus storage s = auditorsStatus[auditor];
    if (s.approved) {
      return;
    } else {
      s.approved = true;
      s.votes = 0;
      s.approvalBlock = block.number;
      nbAuditors ++;
      emit AuditorApproved(auditor, true);
    }
  }


  function onAuditorRejected(address auditor) virtual internal {

  }


  function rejectAuditor(address auditor) private {
    AuditorStatus storage s = auditorsStatus[auditor];
    if (!s.approved) {
      return;
    } else {
      s.approved = false;
      s.votes = 0;
      s.approvalBlock = block.number;
      nbAuditors --;
      onAuditorRejected(auditor);
      emit AuditorApproved(auditor, false);
    }
  }

  /**
  * Only a node with a footprint can vote on an auditor
  * Only an auditor registered can be voted on
  * A non approved auditor that reaches enough votes (N/2+1) becomes approved
  * An approved auditor that reaches enougth votes (N/2+1) becomes un approved
  * a node can vote in or out until the auditor change its status
  */

  function voteAuditor(address auditor, bool accept) override public {
    ICarbonFootprint me = ICarbonFootprint(address(this));
    require(me.footprint(msg.sender) > 0, "only audited nodes can vote for auditors");
    
    AuditorStatus storage s = auditorsStatus[auditor];
    require(s.registered, "the proposed auditor is not registered");

    NodeVote storage lastVote = s.voters[msg.sender];
    bool vote = lastVote.vote;
    // If the node has never voted, its lastVote.atBlock is zero
    // If he has voted and the auditor status has changed since the vote, its like its last vote was in favor of the current status
    if (lastVote.atBlock == 0 || lastVote.atBlock <= s.approvalBlock) {
      // the node vote is forced to the current status to decide if the vote should change the status
      vote = s.approved;
    }
    uint N = me.nbNodes();
    uint minVotes = N / 2 +1;

    // the vote should be the inverse of the previous vote or it shall have no effect
    if (accept == vote) {
      return;
    } else {
      lastVote.vote = accept;
      lastVote.atBlock = block.number;
      emit AuditorVoted(auditor, msg.sender, accept);

      if (!s.approved) {
        // not yet approved : accept should increase the number of votes
        if (accept) {
          s.votes ++;
        } else {
          s.votes --;
        }
        if (s.votes>=minVotes) {
          approveAuditor(auditor);
        }
      } else {
        // already approved : accept should decrease the numner of votes
        if (accept) {
          s.votes --;
        } else {
          s.votes ++;
        }
        if (s.votes>=minVotes) {
          rejectAuditor(auditor);
        }
      }
    }
  }


  function auditorRegistered(address auditor) override public view returns (bool) {
    AuditorStatus storage s = auditorsStatus[auditor];
    return s.registered;
  }


  function auditorApproved(address auditor) override public view returns (bool) {
    AuditorStatus storage s = auditorsStatus[auditor];
    return s.approved;
  }


  function auditorVotes(address auditor) override public view returns (uint) {
    AuditorStatus storage s = auditorsStatus[auditor];
    return s.votes;
  }


  function auditorLastAuditInfo(address auditor) override public view returns (uint atBlock, uint minPledge) {
    AuditorStatus storage s = auditorsStatus[auditor];
    atBlock = s.lastAuditAtBlock;
    minPledge = s.minPledgeAtLastAudit;
  }


  function minPledgeAmountToAuditNode(address auditor) public view returns (uint) {
      AuditorStatus storage s = auditorsStatus[auditor];
      uint M = s.minPledgeAtLastAudit;
      uint B = s.lastAuditAtBlock;
      uint maxNbBlock = 650_000;
      uint nbBlocks = block.number - B;
      uint P = 1000 ether;
      if ( nbBlocks < maxNbBlock && M > 0) {
        // there is an amortisation of the previous pledge amount to be added
        //      P = M * (1 - b / 650 000) + 1 000
        // eq   P = 1 000 + M - M*b/650 000
        P = P + M - (M * nbBlocks / maxNbBlock);
      }
      return P;
  }


  function auditorSettingFootprint(address auditor) override public returns (bool) {
    AuditorStatus storage s = auditorsStatus[auditor];
    IPledgeContract me = IPledgeContract(address(this));

    if (s.approved) { // auditor must still be approved
      uint currentPledge = me.pledgedAmount(auditor);
      uint P = minPledgeAmountToAuditNode(auditor);
      if (currentPledge < P) {
        // not enough pledge in the contract
        return false;
      } else {
        // enough pledge, save the calculation
        s.minPledgeAtLastAudit = P;
        s.lastAuditAtBlock = block.number;
        return true;
      }
    } else {
      return false;
    }
  }

}

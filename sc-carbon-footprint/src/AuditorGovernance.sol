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

    AuditorStatus storage s = auditorsStatus[msg.sender];

    if (!s.registered) {      // not registered
      (s.registered, s.registeredAtBlock) = (true, block.number);
      emit AuditorRegistered(msg.sender);
      if (nbAuditors == 0) {  // the first auditor is automatically approved as part of the bootstrap
        approveAuditor(msg.sender);
      } else {
        (s.approved, s.votes)  = (false, 0);
      }
    }
  }


  function approveAuditor(address _auditor) private {

    AuditorStatus storage s = auditorsStatus[_auditor];

    if (!s.approved) { //not approved
      (s.approved, s.votes, s.approvalBlock) = (true, 0, block.number);
      nbAuditors ++;
      emit AuditorApproved(_auditor, true);
    }
  }


  function onAuditorRejected(address _auditor) virtual internal {

  }


  function rejectAuditor(address _auditor) private {

    AuditorStatus storage s = auditorsStatus[_auditor];

    if (s.approved) {
      (s.approved, s.votes, s.approvalBlock) = (false, 0, block.number);
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

    require(me.footprint(msg.sender) > 0, "only audited nodes can vote for auditors");
    require(auditorsStatus[_auditor].registered, "the proposed _auditor is not registered");

    AuditorStatus storage s = auditorsStatus[_auditor];

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


  function minPledgeAmountToAuditNode(address _auditor) public view returns (uint) {

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
        (s.minPledgeAtLastAudit, s.lastAuditAtBlock) = (minPledgeAmountToAuditNode(_auditor), block.number);
        return true;
      }
    } else {
      return false;
    }
  }

}

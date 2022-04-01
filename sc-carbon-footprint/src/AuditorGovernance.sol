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

    // If the node has never voted, its lastVote.atBlock is zero
    // If the node has already voted & the auditor status has changed since the vote, its last vote was in favor of current status
    if (auditorsStatus[_auditor].voters[msg.sender].atBlock == 0 || auditorsStatus[_auditor].voters[msg.sender].atBlock <= auditorsStatus[_auditor].approvalBlock) {
      // the node vote is forced to the current status to decide if the vote should change the status
      auditorsStatus[_auditor].voters[msg.sender].vote = auditorsStatus[_auditor].approved;
    }


    uint _nbNodes = me.nbNodes();

    uint minVotes = _nbNodes / 2 + 1;

    // the vote should be the inverse of the previous vote or it shall have no effect
    if (_accept == auditorsStatus[_auditor].voters[msg.sender].vote) {
      return;
    } else {
      auditorsStatus[_auditor].voters[msg.sender].vote  = _accept;
      auditorsStatus[_auditor].voters[msg.sender].atBlock = block.number;
      emit AuditorVoted(_auditor, msg.sender, _accept);

      if (!auditorsStatus[_auditor].approved) {
        // not yet approved : accept should increase the number of votes
        if (_accept) {
          auditorsStatus[_auditor].votes ++;
        } else {
          auditorsStatus[_auditor].votes --;
        }
        if (auditorsStatus[_auditor].votes >= minVotes) {
          approveAuditor(_auditor);
        }
      } else {
        // already approved : accept should decrease the numner of votes
        if (_accept) {
          auditorsStatus[_auditor].votes --;
        } else {
          auditorsStatus[_auditor].votes ++;
        }
        if (auditorsStatus[_auditor].votes >= minVotes) {
          rejectAuditor(_auditor);
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

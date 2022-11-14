// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/IImprovementProposal.sol";
import "./intf/Constants.sol";


contract ImprovementProposal is IImprovementProposal {
  // uint constant private _blockDelayBeforeVote = 1_950_000;
  // uint constant private _blockSpanForVote = 400_000;
  // function getBlockConstantValues() virtual internal pure returns (uint blockDelayBeforeVote, uint blockSpanForVote) {
  //   blockDelayBeforeVote = 1_950_000;
  //   blockSpanForVote = 400_000;
  // }

  function getConstantValue(uint) virtual internal pure returns (uint) {
      return 0;
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

  function nbImprovementProposals() public view returns (uint) {
    return nbIPs;
  }


  function voteAllowed(IP storage _ip) internal view returns (bool) {
    IPStatus status = evaluateStatus(_ip);
    //require(false, statusToString(status));
    if (status == IPStatus.VoteOpen) {
      return true;
    } 
    if (status == IPStatus.VoteStarted) {
      return true;
    }
    return false;
  }

  function evaluateStatus(IP storage _ip) private view returns (IPStatus status) {
    uint blockDelayBeforeVote = getConstantValue(Const_BlockDelayBeforeVote);
    uint blockSpanForVote = getConstantValue(Const_BlockSpanForVote);
    uint voteFrom = _ip.firstVoteAtBlock;
    if (voteFrom < _ip.createdAtBlock) {
      voteFrom = _ip.createdAtBlock + blockDelayBeforeVote;
    }
    uint voteUntil = voteFrom + blockSpanForVote;
    if (block.number < voteFrom ) { // before the vote can start
      status = IPStatus.Proposed;
    } else if (block.number <= voteUntil) { // before the vote is closed
      if (_ip.auditorsVoteFor + _ip.auditorsVoteAgainst + _ip.nodesVoteFor + _ip.nodesVoteAgainst == 0) {
        // no vote yet
        status = IPStatus.VoteOpen;
      } else {
        // some vote yet
        status = IPStatus.VoteStarted;
      }
    } else { // after the vote is closed
      if (_ip.nodesVoteFor > _ip.nodesVoteAgainst && _ip.auditorsVoteFor > _ip.auditorsVoteAgainst) {
        // a majority of both categories are for the change
        status = IPStatus.Approved;
      } else {
        // no majority
        status = IPStatus.Rejected;
      }
    }
  }

  function getImprovementProposal(uint _index) public view returns (
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
    uint blockDelayBeforeVote = getConstantValue(Const_BlockDelayBeforeVote);
    uint blockSpanForVote = getConstantValue(Const_BlockSpanForVote);
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

  function senderType() virtual internal view returns(SenderType sType, address actual) {
    return (SenderType.Node, msg.sender);
  }
  function newProposal() public {
    (SenderType s,) = senderType();
    require(s != SenderType.Invalid, "not allowed to create a proposal");
    IP storage ip = ips[nbIPs];
    ip.index = nbIPs ++;
    ip.createdAtBlock = block.number;

    emit IPChanged(ip.index, IPStatus.Proposed);
  }

  function voteForProposal(uint _index) public {
    require(_index < nbIPs, "invalid index");
    IP storage ip = ips[_index];
    require(voteAllowed(ip), "vote is closed");
    (SenderType s, address actualVoter) = senderType();
    require(s != SenderType.Invalid, "not allowed to vote");

    if ( ip.firstVoteAtBlock == 0 ) {
      // first vote
      ip.firstVoteAtBlock = block.number;
      emit IPChanged(ip.index, IPStatus.VoteStarted);
    }

    if (s == SenderType.Auditor) {
      int8 currentVote = ip.auditorVotes[actualVoter];
      if (currentVote == 1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == -1) {
        // invert the vote 
        ip.auditorsVoteAgainst --;
        ip.auditorsVoteFor ++;
        ip.auditorVotes[actualVoter] = 1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.auditorsVoteFor ++;
        ip.auditorVotes[actualVoter] = 1;
      }
    } 
    if (s == SenderType.Node) {
      int8 currentVote = ip.nodeVotes[actualVoter];
      if (currentVote == 1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == -1) {
        // invert the vote 
        ip.nodesVoteAgainst --;
        ip.nodesVoteFor ++;
        ip.nodeVotes[actualVoter] = 1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.nodesVoteFor ++;
        ip.nodeVotes[actualVoter] = 1;
      }
    }
    emit IPVote(_index, actualVoter, s, 1);
  }

  function voteAgainstProposal(uint _index) public {
    require(_index < nbIPs, "invalid index");
    IP storage ip = ips[_index];
    require(voteAllowed(ip), "vote is closed");
    (SenderType s, address actualVoter) = senderType();
    require(s != SenderType.Invalid, "not allowed to vote");

    if ( ip.firstVoteAtBlock == 0 ) {
      // first vote
      ip.firstVoteAtBlock = block.number;
      emit IPChanged(ip.index, IPStatus.VoteStarted);
    }

    if (s == SenderType.Auditor) {
      int8 currentVote = ip.auditorVotes[actualVoter];
      if (currentVote == -1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == 1) {
        // invert the vote 
        ip.auditorsVoteFor --;
        ip.auditorsVoteAgainst ++;
        ip.auditorVotes[actualVoter] = -1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.auditorsVoteAgainst ++;
        ip.auditorVotes[actualVoter] = -1;
      }
    } 
    if (s == SenderType.Node) {
      int8 currentVote = ip.nodeVotes[actualVoter];
      if (currentVote == -1) {
        // already the same vote, do nothing
        return;
      }
      if (currentVote == 1) {
        // invert the vote 
        ip.nodesVoteFor --;
        ip.nodesVoteAgainst ++;
        ip.nodeVotes[actualVoter] = -1;
      }
      if (currentVote == 0) {
        // no previous vote
        ip.nodesVoteAgainst ++;
        ip.nodeVotes[actualVoter] = -1;
      }
    }

    emit IPVote(_index, actualVoter, s, -1);

  }
}
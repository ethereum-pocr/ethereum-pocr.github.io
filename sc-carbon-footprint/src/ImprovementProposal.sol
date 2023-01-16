// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "./intf/IImprovementProposal.sol";
import "./intf/Constants.sol";


contract ImprovementProposal is IImprovementProposal {
  // uint256 constant private _blockDelayBeforeVote = 1_950_000;
  // uint256 constant private _blockSpanForVote = 400_000;
  // function getBlockConstantValues() virtual internal pure returns (uint256 blockDelayBeforeVote, uint256 blockSpanForVote) {
  //   blockDelayBeforeVote = 1_950_000;
  //   blockSpanForVote = 400_000;
  // }

  function getConstantValue(uint256) virtual internal view returns (uint256) {
      return 0;
  }

  struct IP {
    uint256 index;
    uint256 createdAtBlock;
    uint256 nodesVoteFor;
    uint256 nodesVoteAgainst;
    uint256 auditorsVoteFor;
    uint256 auditorsVoteAgainst;
    mapping(address => int8) nodeVotes; // -1 ; 0 ; +1
    mapping(address => int8) auditorVotes; // -1 ; 0 ; +1
    uint256 firstVoteAtBlock;
  }
  mapping(uint256=>IP) private ips;
  uint256 private nbIPs;

  function nbImprovementProposals() public view returns (uint256) {
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
    uint256 blockDelayBeforeVote = getConstantValue(Const_BlockDelayBeforeVote);
    uint256 blockSpanForVote = getConstantValue(Const_BlockSpanForVote);
    uint256 voteFrom = _ip.firstVoteAtBlock;
    if (voteFrom < _ip.createdAtBlock) {
      voteFrom = _ip.createdAtBlock + blockDelayBeforeVote;
    }
    uint256 voteUntil = voteFrom + blockSpanForVote;
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

  function getImprovementProposal(uint256 _index) public view returns (
    uint256 index,
    IPStatus status,
    uint256 createdBlock,
    uint256 voteFromBlock,
    uint256 voteUntilBlock,
    uint256 auditorsFor,
    uint256 auditorsAgainst,
    uint256 nodesFor,
    uint256 nodesAgainst
  ) {
    uint256 blockDelayBeforeVote = getConstantValue(Const_BlockDelayBeforeVote);
    uint256 blockSpanForVote = getConstantValue(Const_BlockSpanForVote);
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

  function voteForProposal(uint256 _index) public {
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

  function voteAgainstProposal(uint256 _index) public {
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
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/IImprovementProposal.sol";


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
  function nbImprovementProposals() public view returns (uint) {
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



  function newProposal() public {

    require(senderType() != SenderType.Invalid, "not allowed to create a proposal");

    IP storage ip = ips[nbIPs];
    ip.index = nbIPs ++;
    ip.createdAtBlock = block.number;

    emit IPChanged(ip.index, IPStatus.Proposed);
  }




  function voteForProposal(uint index) public {

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



  function voteAgainstProposal(uint index) public {

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
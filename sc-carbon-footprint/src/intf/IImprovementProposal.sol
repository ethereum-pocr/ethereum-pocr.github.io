// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

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
  function voteForProposal(uint index) external;
  function voteAgainstProposal(uint index) external;
}
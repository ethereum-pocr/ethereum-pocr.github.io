// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface IImprovementProposal {
  enum IPStatus {Proposed, VoteOpen, VoteStarted, Approved, Rejected}
  event IPChanged(uint256 indexed index, IPStatus indexed status);
  function newProposal() external;
  function nbImprovementProposals() external view returns (uint256);
  function getImprovementProposal(uint256 _index) external view returns (
    uint256 index,
    IPStatus status,
    uint256 createdBlock,
    uint256 voteFromBlock,
    uint256 voteUntilBlock,
    uint256 auditorsFor,
    uint256 auditorsAgainst,
    uint256 nodesFor,
    uint256 nodesAgainst
  );

  enum SenderType {Invalid, Auditor, Node}

  event IPVote(uint256 indexed index, address indexed voter, SenderType category, int vote);
  function voteForProposal(uint256 index) external;
  function voteAgainstProposal(uint256 index) external;
}
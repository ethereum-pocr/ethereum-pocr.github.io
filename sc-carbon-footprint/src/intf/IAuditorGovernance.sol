// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface IAuditorGovernance {
  function selfRegisterAuditor() external;
  function voteAuditor(address auditor, bool accept) external;
  function nbAuditors() external view returns (uint256);
  function auditorAddress(uint256 index) external view returns (address);
  function currentAuditorVote(address _auditor, address _node) external view returns (bool);
  function auditorRegistered(address auditor) external view returns (bool);
  function auditorApproved(address auditor) external view returns (bool);
  function auditorVotes(address auditor) external view returns (uint256);
  function auditorLastAuditInfo(address auditor) external view returns (uint256 atBlock, uint256 minPledge);
  function minPledgeAmountToAuditNode(address auditor) external view returns (uint256);
  function auditorSettingFootprint(address auditor) external returns (bool);
  event AuditorRegistered(address indexed auditor);
  event AuditorVoted(address indexed auditor, address indexed by, bool accepted);
  event AuditorApproved(address indexed auditor, bool approved);
}

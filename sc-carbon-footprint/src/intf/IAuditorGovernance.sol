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

// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./CarbonFootprint.sol";
import "./AuditorGovernance.sol";
import "./PledgeContract.sol";
import "./ImprovementProposal.sol";


contract Governance is CarbonFootprint, AuditorGovernance, PledgeContract, ImprovementProposal {
  

  /** Auditor can transfer his pledge out if his last audit is more that 30 days ago */
  function canTransferPledge(address payable auditor, uint) override internal view returns (bool) {


    // First the auditor must be approved
    if (!auditorApproved(auditor)) {
      return false;
    }


    // Then the last audit should be less that 30 days ago
    uint maxNbBlock = 650_000; // 30 days
    uint atBlock;
    uint minPledge;
    (atBlock, minPledge) = auditorLastAuditInfo(auditor);

    return block.number >= (atBlock + maxNbBlock);
  }




  /** the caller must be a node with a valid footprint */
  function canSenderOperateTransfer() override internal view returns (bool) {
    uint f = this.footprint(msg.sender);

    return f > 0;
  }

  /** called when an auditor is rejected and is implemented by confiscating the pledge */
  function onAuditorRejected(address auditor) override internal {
    confiscatePledge(auditor);
  }

  function hasEnoughVote(uint votes) override internal view returns (bool) {
    uint N = this.nbNodes();
    return votes >= (N / 2 + 1);
  }

  /** called to decide is the sender is a node or an auditor, used by improvement proposal */
  function senderType() override internal view returns(SenderType) {
    if (auditorApproved(msg.sender)) {
      return SenderType.Auditor;
    }
    
    uint f = this.footprint(msg.sender);
    if (f>0) {
      return SenderType.Node;
    }

    return SenderType.Invalid;
  }
}
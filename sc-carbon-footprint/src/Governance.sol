// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./CarbonFootprint.sol";
import "./AuditorGovernance.sol";
import "./PledgeContract.sol";
import "./ImprovementProposal.sol";

contract Governance is
    CarbonFootprint,
    AuditorGovernance,
    PledgeContract,
    ImprovementProposal
{
    /** Auditor can transfer his pledge out if his last audit is more that 30 days ago */
    function canTransferPledge(address payable _auditor, uint256)
        internal
        view
        override
        returns (bool)
    {
        // First the auditor must be approved
        if (!auditorApproved(_auditor)) {
            return false;
        }

        // Then the last audit should be less that 30 days ago
        uint256 minimalPeriod = 650_000; // 30 days
        uint256 lastAuditAtBlock;

        (lastAuditAtBlock, ) = auditorLastAuditInfo(_auditor);

        return block.number >= (lastAuditAtBlock + minimalPeriod);
    }

    /** the caller must be a node with a footprint superior to zero (means the node exists)*/
    function canSenderOperateTransfer() internal view override returns (bool) {
        uint256 footprint = this.footprint(msg.sender);

        return footprint > 0;
    }

    /** called when an auditor is rejected and is implemented by confiscating the pledge */
    function onAuditorRejected(address _auditor) internal override {
        confiscatePledge(_auditor);
    }

    function hasEnoughVote(uint256 _votes)
        internal
        view
        override
        returns (bool)
    {
        uint256 nbNodes = this.nbNodes();

        return _votes >= (nbNodes / 2 + 1);
    }

    /** called to decide is the sender is a node or an auditor, used by improvement proposal */
    function senderType() internal view override returns (SenderType) {
        if (auditorApproved(msg.sender)) {
            return SenderType.Auditor;
        }

        uint256 footprint = this.footprint(msg.sender);

        if (footprint > 0) {
            return SenderType.Node;
        }

        return SenderType.Invalid;
    }
}

// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./CarbonFootprint.sol";
import "./AuditorGovernance.sol";
import "./PledgeContract.sol";
import "./ImprovementProposal.sol";
import "./NodeDelegation.sol";

contract Governance is
    CarbonFootprint,
    AuditorGovernance,
    PledgeContract,
    ImprovementProposal,
    NodeDelegation
{

    function isSealerNode(address node) public view returns(bool) {
        return this.footprint(node) > 0;
    }

    function canActAsSealerNode(address sender) public view returns(bool) {
        // first check if actual sealer
        bool ok = isSealerNode(sender);
        if (ok) {
            return true;
        } else {
            address node = delegateOf(sender);
            if (node != address(0)) {
                return isSealerNode(node);
            } else {
                return false;
            }
        }
    }

    /** Auditor can transfer his pledge out if his last audit is more that 30 days ago */
    function canTransferPledge(address payable _auditor, uint256)
        public
        view
        override
        returns (bool, uint256)
    {
        // First the auditor must be approved
        if (!auditorApproved(_auditor)) {
            return (false,0);
        }

        // Then the last audit should be less that 30 days ago
        uint256 minimalPeriod = 650_000; // 30 days
        uint256 lastAuditAtBlock;

        (lastAuditAtBlock, ) = auditorLastAuditInfo(_auditor);

        bool isBlockOK = (block.number >= (lastAuditAtBlock + minimalPeriod));
        uint256 redeemAtBlock = lastAuditAtBlock + minimalPeriod;

        return (isBlockOK, redeemAtBlock);
    }

    /** the caller must be a sealer node with a footprint superior to zero (means the node exists)*/
    function canSenderOperateTransfer() internal view override returns (bool) {
        return canActAsSealerNode(msg.sender);
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

        if (canActAsSealerNode(msg.sender)) {
            return SenderType.Node;
        }

        return SenderType.Invalid;
    }

    function canVoteAuditor() internal view override returns(bool) {
        return canActAsSealerNode(msg.sender);
    }
}

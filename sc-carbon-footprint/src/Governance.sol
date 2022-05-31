// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./CarbonFootprint.sol";
import "./AuditorGovernance.sol";
import "./PledgeContract.sol";
import "./ImprovementProposal.sol";
import "./NodeDelegation.sol";

/**
 * @notice
 * The objective of this contract is to group some governance rules
 * around the consensus
 */

contract Governance is
    CarbonFootprint,
    AuditorGovernance,
    PledgeContract,
    ImprovementProposal,
    NodeDelegation
{
    /** @notice This function returns true if the node address has a footprint > 0 */
    function isSealerNode(address node) public view returns (bool) {
        return this.footprint(node) > 0;
    }

    /**
     * @notice
     * This function returns true
     * IF the address sender has a footprint
     * OR the address sender has a delegation
     */
    function canActAsSealerNode(address sender) public view returns (bool) {
        /** @notice first check if actual sealer */
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

    /** @notice Auditor can transfer his pledge out if his last audit is more that 30 days ago */
    function canTransferPledge(address payable _auditor, uint256)
        public
        view
        override
        returns (bool, uint256)
    {
        /** @notice First the auditor must be approved */
        if (!auditorApproved(_auditor)) {
            return (false, 0);
        }

        /** @notice Then the last audit should be less that 30 days ago */
        uint256 minimalPeriod = 650_000; // 30 days
        uint256 lastAuditAtBlock;

        (lastAuditAtBlock, ) = auditorLastAuditInfo(_auditor);

        if (lastAuditAtBlock == 0) {
            /** @notice there has not been any audit yet, so auditor can redeem its pledge immediatly */
            return (true, 0);
        } else {
            bool isBlockOK = (block.number >=
                (lastAuditAtBlock + minimalPeriod));
            uint256 redeemAtBlock = lastAuditAtBlock + minimalPeriod;

            return (isBlockOK, redeemAtBlock);
        }
    }

    /** @notice the caller must be a sealer node
     * with a footprint superior to zero (means the node exists)
     */
    function canSenderOperateTransfer() internal view override returns (bool) {
        return canActAsSealerNode(msg.sender);
    }

    /** @notice called when an auditor is rejected
     * and is implemented by confiscating the pledge
     */
    function onAuditorRejected(address _auditor) internal override {
        confiscatePledge(_auditor);
    }

    /** @notice calculate if the number of votes has majority */
    function hasEnoughVote(uint256 _votes)
        internal
        view
        override
        returns (bool)
    {
        uint256 nbNodes = this.nbNodes();

        return _votes >= (nbNodes / 2 + 1);
    }

    /** @notice called to decide is the sender is a node or an auditor, used by improvement proposal
     * It returns the type and the actual address of the type, ie the sender or the delegated node address
     */
    function senderType()
        internal
        view
        override
        returns (SenderType sType, address actual)
    {
        if (auditorApproved(msg.sender)) {
            return (SenderType.Auditor, msg.sender);
        }

        if (canActAsSealerNode(msg.sender)) {
            address node = delegateOf(msg.sender);
            if (node == address(0)) {
                node = msg.sender;
            }
            return (SenderType.Node, node);
        }

        return (SenderType.Invalid, msg.sender);
    }

    /** @notice  checks if the node can vote, as it is registered as a sealer */
    function canVoteAuditor() internal view override returns (bool) {
        return canActAsSealerNode(msg.sender);
    }
}

// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/ICarbonFootprint.sol";
import "./intf/IAuditorGovernance.sol";
import "./intf/IPledgeContract.sol";

contract AuditorGovernance is IAuditorGovernance {
    struct NodeVote {
        bool vote;
        uint256 atBlock;
    }

    struct AuditorStatus {
        bool registered;
        uint256 votes;
        bool approved;
        uint256 registeredAtBlock;
        uint256 statusUpdateBlock;
        mapping(address => NodeVote) voters;
        uint256 minPledgeAtLastAudit; // the calculated amount of the minimum pledge at last audit done
        uint256 lastAuditAtBlock; // the block number of the last audit done
    }

    mapping(address => AuditorStatus) private auditorsStatus;

    mapping(uint256 => address) public auditorsAddresses;

    uint256 public nbAuditors;

    uint256 private nbApprovedAuditors;

    function selfRegisterAuditor() public override {
        AuditorStatus storage s = auditorsStatus[msg.sender];

        if (!s.registered) {
            // not registered
            s.registered = true;
            s.registeredAtBlock = block.number;
            emit AuditorRegistered(msg.sender);
            if (nbApprovedAuditors == 0) {
                // the first auditor is automatically approved as part of the bootstrap
                approveAuditor(msg.sender);
            } else {
                s.approved = false;
                s.votes = 0;
            }
            auditorsAddresses[nbAuditors] = msg.sender;
            nbAuditors++;
        }
    }

    function approveAuditor(address _auditor) private {
        AuditorStatus storage s = auditorsStatus[_auditor];

        if (!s.approved) {
            //not approved
            s.approved = true;
            s.votes = 0;
            s.statusUpdateBlock = block.number;
            nbApprovedAuditors++;
            emit AuditorApproved(_auditor, true);
        }
    }

    function onAuditorRejected(address _auditor) internal virtual {}

    function rejectAuditor(address _auditor) private {
        AuditorStatus storage s = auditorsStatus[_auditor];

        if (s.approved) {
            s.approved = false;
            s.votes = 0;
            s.statusUpdateBlock = block.number;
            nbApprovedAuditors--;
            onAuditorRejected(_auditor);
            emit AuditorApproved(_auditor, false);
        }
    }
    /**
     * Virtual function overriden in the Governance.sol to tell if the msg.sender can vote an auditor with its address
     */
    function canVoteAuditor() virtual internal view returns(bool) {
        return true;
    }

    /**
     * Only a node with a footprint can vote on an auditor
     * Only an auditor registered can be voted on
     * A non approved auditor that reaches enough votes (N/2+1) becomes approved
     * An approved auditor that reaches enougth votes (N/2+1) becomes un approved
     * a node can vote in or out until the auditor change its status
     */

    function voteAuditor(address _auditor, bool _accept) public override {
        ICarbonFootprint me = ICarbonFootprint(address(this));
        AuditorStatus storage s = auditorsStatus[_auditor];

        require(
            canVoteAuditor(),
            "only audited nodes which have footprint can vote for auditors"
        );
        require(s.registered, "the proposed _auditor is not registered");

        bool currentVote = currentAuditorVote(_auditor, msg.sender);
        uint256 minVotes = me.nbNodes() / 2 + 1;

        // the new vote should be the inverse of the current vote or it shall have no effect
        if (_accept != currentVote) {
            (s.voters[msg.sender].vote, s.voters[msg.sender].atBlock) = (
                _accept,
                block.number
            );

            emit AuditorVoted(_auditor, msg.sender, _accept);

            if (!s.approved) {
                // not yet approved : accept should increase the number of votes
                if (_accept) {
                    s.votes++;
                } else {
                    s.votes--;
                }

                if (auditorsStatus[_auditor].votes >= minVotes) {
                    approveAuditor(_auditor);
                }
            } else {
                // already approved : accept should decrease the number of votes
                if (_accept) {
                    s.votes--;
                } else {
                    s.votes++;
                }

                if (s.votes >= minVotes) {
                    rejectAuditor(_auditor);
                }
            }
        }
    }

    function auditorAddress(uint256 _index)
        public
        view
        override
        returns (address)
    {
        return auditorsAddresses[_index];
    }

    function currentAuditorVote(address _auditor, address _node)
        public
        view
        override
        returns (bool)
    {
        AuditorStatus storage s = auditorsStatus[_auditor];

        // If the node has not yet vote since last auditor status update, the current node vote is considered agreed with the current status (no vote for status change)
        if (
            s.voters[_node].atBlock == 0 || // The node has never voted at all (lastVote.atBlock is zero)
            s.voters[_node].atBlock <= s.statusUpdateBlock // The node has not vote since last auditor status update (s.voters[msg.sender].atBlock <= s.statusUpdateBlock)
        ) {
            // the current node vote is considered agreed with the current status (no vote for status change)
            return s.approved;
        }

        return s.voters[msg.sender].vote;
    }

    function auditorRegistered(address _auditor)
        public
        view
        override
        returns (bool)
    {
        return auditorsStatus[_auditor].registered;
    }

    function auditorApproved(address _auditor)
        public
        view
        override
        returns (bool)
    {
        return auditorsStatus[_auditor].approved;
    }

    function auditorVotes(address _auditor)
        public
        view
        override
        returns (uint256)
    {
        return auditorsStatus[_auditor].votes;
    }

    function auditorLastAuditInfo(address _auditor)
        public
        view
        override
        returns (uint256, uint256)
    {
        return (
            auditorsStatus[_auditor].lastAuditAtBlock,
            auditorsStatus[_auditor].minPledgeAtLastAudit
        );
    }

    function minPledgeAmountToAuditNode(address _auditor)
        public
        view
        returns (uint256)
    {
        AuditorStatus storage s = auditorsStatus[_auditor];
        uint256 minPledgeAtLastAudit = s.minPledgeAtLastAudit;
        uint256 maxNbBlockPerPeriod = 650_000;
        uint256 nbBlocks = block.number - s.lastAuditAtBlock;
        uint256 minPledge = 1000 ether;

        if (nbBlocks < maxNbBlockPerPeriod && minPledgeAtLastAudit > 0) {
            // there is an amortisation of the previous pledge amount to be added
            //       = minPledge * (1 - nbBlocks / 650 000) + 1 000
            // eq   minPledge = 1 000 + minPledge - minPledge * nbBlocks / 650 000
            minPledge =
                minPledge +
                minPledgeAtLastAudit -
                ((minPledgeAtLastAudit * nbBlocks) / maxNbBlockPerPeriod);
        }

        return minPledge;
    }

    function auditorSettingFootprint(address _auditor)
        public
        override
        returns (bool)
    {
        IPledgeContract me = IPledgeContract(address(this));
        AuditorStatus storage s = auditorsStatus[_auditor];

        if (s.approved) {
            // auditor must still be approved
            if (
                me.pledgedAmount(_auditor) <
                minPledgeAmountToAuditNode(_auditor)
            ) {
                // not enough pledge in the contract
                return false;
            } else {
                // enough pledge, save the calculation
                s.minPledgeAtLastAudit = minPledgeAmountToAuditNode(_auditor);
                s.lastAuditAtBlock = block.number;
                return true;
            }
        } else {
            return false;
        }
    }
}

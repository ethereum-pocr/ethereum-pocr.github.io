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

    /**
     * @notice
     * The struct AuditorStatus maintains all registration data relative to one auditor
     *
     * @dev
     * The struct contains the voters mapping, which gets all node's addresses and vote
     * once they have voted
     */
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

    /** @notice this function enables an auditor to register by itself
     * if it's the first auditor, then it is instantly approved */
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

    /** @notice this function set the auditor status to approved 
     *  @dev this function is internal and called in functions selfRegisterAuditor and voteAuditor
     */
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

    /** @dev this function is implemented in Governance.sol contract */
    function onAuditorRejected(address _auditor) internal virtual {}

    /** @notice the objective of this function is to set the status on an auditor to rejected 
     * after a majority of votes against him 
     *  @dev this function is internal and called in function voteAuditor
     */
    function rejectAuditor(address _auditor) private {
        AuditorStatus storage s = auditorsStatus[_auditor];

        if (s.approved) {
            s.approved = false;
            s.votes = 0;
            s.lastAuditAtBlock = 0; // Reset the audit status
            s.minPledgeAtLastAudit = 0; // Reset the audit status
            s.statusUpdateBlock = block.number;
            nbApprovedAuditors--;
            onAuditorRejected(_auditor);
            emit AuditorApproved(_auditor, false);
        }
    }

    /**
     * @dev Virtual function overriden in the Governance.sol 
     * to tell if the msg.sender can vote an auditor with its address
     */
    function canVoteAuditor() virtual internal view returns(bool) {
        return true;
    }

    /**
     * @notice Only a node with a footprint can vote on an auditor
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

        /** @notice the new vote should be the inverse of the current vote or it shall have no effect */
        if (_accept != currentVote) {
            (s.voters[msg.sender].vote, s.voters[msg.sender].atBlock) = (
                _accept,
                block.number
            );

            emit AuditorVoted(_auditor, msg.sender, _accept);

            if (!s.approved) {
                /** @notice not yet approved : accept should increase the number of votes */
                if (_accept) {
                    s.votes++;
                } else {
                    s.votes--;
                }

                if (auditorsStatus[_auditor].votes >= minVotes) {
                    approveAuditor(_auditor);
                }
            } else {
                /** @notice already approved : accept should decrease the number of votes */
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

    /** @dev returns the auditor address from an index */
    function auditorAddress(uint256 _index)
        public
        view
        override
        returns (address)
    {
        return auditorsAddresses[_index];
    }

    /** @notice this function returns the vote of a node for an auditor */
    function currentAuditorVote(address _auditor, address _node)
        public
        view
        override
        returns (bool)
    {
        AuditorStatus storage s = auditorsStatus[_auditor];

        /** @notice If the node has not yet vote since last auditor status update, the current node vote is considered agreed with the current status (no vote for status change) */
        if (
            s.voters[_node].atBlock == 0 || /** @notice The node has never voted at all (lastVote.atBlock is zero) */
            s.voters[_node].atBlock <= s.statusUpdateBlock /** @notice The node has not vote since last auditor status update (s.voters[msg.sender].atBlock <= s.statusUpdateBlock) */
        ) {
            /** @notice the current node vote is considered agreed with the current status (no vote for status change) */
            return s.approved;
        }

        return s.voters[msg.sender].vote;
    }

    /** @notice this function returns true or false depending on whether the auditor is regitered */
    function auditorRegistered(address _auditor)
        public
        view
        override
        returns (bool)
    {
        return auditorsStatus[_auditor].registered;
    }

    /** @notice this function returns true or false depending on whether the auditor is approved */
    function auditorApproved(address _auditor)
        public
        view
        override
        returns (bool)
    {
        return auditorsStatus[_auditor].approved;
    }

    /** @notice this function returns the number of votes for an auditor */
    function auditorVotes(address _auditor)
        public
        view
        override
        returns (uint256)
    {
        return auditorsStatus[_auditor].votes;
    }

    /** @notice this function returns the block number when the last audit has been done 
     * and also the minimum pledge amount required to do an audit
     */
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

    /** @notice this function calculates and returns the current minimum pledge amount to audit a node */
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
            /** @notice
             * there is an amortisation of the previous pledge amount to be added
             *       = minPledge * (1 - nbBlocks / 650 000) + 1 000
             * eq   minPledge = 1 000 + minPledge - minPledge * nbBlocks / 650 000
             */
            minPledge =
                minPledge +
                minPledgeAtLastAudit -
                ((minPledgeAtLastAudit * nbBlocks) / maxNbBlockPerPeriod);
        }

        return minPledge;
    }

    /** @notice this function is called by CarbonFootprint.sol contract 
     * and is a requirement to enable an auditor to set a footprint 
     */
    function auditorSettingFootprint(address _auditor)
        public
        override
        returns (bool)
    {
        IPledgeContract me = IPledgeContract(address(this));
        AuditorStatus storage s = auditorsStatus[_auditor];

        if (s.approved) {
            /** @notice auditor must still be approved */
            if (
                me.pledgedAmount(_auditor) <
                minPledgeAmountToAuditNode(_auditor)
            ) {
                /** @notice not enough pledge in the contract */
                return false;
            } else {
               /** @notice enough pledge, save the calculation */
                s.minPledgeAtLastAudit = minPledgeAmountToAuditNode(_auditor);
                s.lastAuditAtBlock = block.number;
                return true;
            }
        } else {
            return false;
        }
    }
}

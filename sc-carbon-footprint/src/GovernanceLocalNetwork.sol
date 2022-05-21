// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceLocalNetwork is Governance {

    function getBlockConstantValues()
        internal
        pure
        override
        returns (uint256 blockDelayBeforeVote, uint256 blockSpanForVote)
    {
        blockDelayBeforeVote = 5;
        blockSpanForVote = 100;
    }
}

// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceTesting is Governance {
    uint256 public currentTime = 1649253088;

    function getBlockConstantValues()
        internal
        pure
        override
        returns (uint256 blockDelayBeforeVote, uint256 blockSpanForVote)
    {
        blockDelayBeforeVote = 5;
        blockSpanForVote = 10;
    }
}

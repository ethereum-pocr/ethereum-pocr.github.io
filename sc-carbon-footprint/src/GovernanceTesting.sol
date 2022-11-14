// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceTesting is Governance {
    uint256 public currentTime = 1649253088;

    function getConstantValue(uint key)
        internal
        pure
        override
        returns (uint256)
    {
        if (key == Const_BlockDelayBeforeVote) return 5;
        if (key == Const_BlockSpanForVote) return 10;
        if (key == Const_MaxNbBlockPerPeriod) return 50;
        return 0;
    }
}

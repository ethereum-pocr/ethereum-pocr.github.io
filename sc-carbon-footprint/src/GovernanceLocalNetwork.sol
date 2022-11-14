// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceLocalNetwork is Governance {

    function getConstantValue(uint key)
        internal
        pure
        override
        returns (uint256)
    {
        if (key == Const_BlockDelayBeforeVote) return 5;
        if (key == Const_BlockSpanForVote) return 100;
        if (key == Const_MaxNbBlockPerPeriod) return 50;
        return 0;
    }
}

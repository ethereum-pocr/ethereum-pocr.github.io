// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "./Governance.sol";

contract GovernanceLocalNetwork is Governance {

    function getConstantValue(uint256 key)
        internal
        pure
        override
        returns (uint256)
    {
        if (key == Const_BlockDelayBeforeVote) return 5;
        if (key == Const_BlockSpanForVote) return 100;
        if (key == Const_MaxNbBlockPerPeriod) return 50;
        if (key == Const_MinPledgeAmountWei) return 1000 ether;
        return 0;
    }
}

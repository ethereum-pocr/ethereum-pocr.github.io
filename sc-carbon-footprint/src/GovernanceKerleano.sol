// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceKerleano is Governance {

    function getConstantValue(uint key)
        internal
        pure
        override
        returns (uint256)
    {
        if (key == Const_BlockDelayBeforeVote) return 1_971_000;
        if (key == Const_BlockSpanForVote) return 657_000;
        if (key == Const_MaxNbBlockPerPeriod) return 1_971_000;
        if (key == Const_MinPledgeAmountWei) return 5000 ether;
        return 0;
    }
}

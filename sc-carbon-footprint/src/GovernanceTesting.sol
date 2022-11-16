// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceTesting is Governance {
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

    // @dev: Only for the testing. replaces what the synchro process does in Geth
    function setNbNodes(uint256 n) public {
        nbNodes = n;
    }
    // @dev: only for the testing. replaces what the synchro process does in Geth
    function setAsSealerAt(uint256 index, address node) public {
        sealers[index]=node;
        if (node == address(0)) {
            isSealer[node] = false;
        } else {
            isSealer[node] = true;
        }
    }
}

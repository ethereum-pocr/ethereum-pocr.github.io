// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceKerleano is Governance {
    // This is for the Test network only allowing nodes to update the params if needed
    mapping(uint => uint256) public params;
    function getConstantValue(uint key)
        internal
        view
        override
        returns (uint256)
    {
        uint256 val = params[key];
        if (val > 0) return val;
        // default values
        if (key == Const_BlockDelayBeforeVote) return 1_971_000; // 3 months = (365/4)*(24*3600)/4 = 1,971,000
        if (key == Const_BlockSpanForVote) return 657_000; // 1 month = (365/12)*(24*3600)/4 = 657,000
        if (key == Const_MaxNbBlockPerPeriod) return 1_971_000; // 3 months = (365/4)*(24*3600)/4 = 1,971,000
        if (key == Const_MinPledgeAmountWei) return 5000 ether; // 5,000 ₡
        return 0;
    }

    // This is for the Test network only allowing nodes to update the params if needed
    function setGovernanceParam(uint key, uint256 value) public {
        require(canActAsSealerNode(msg.sender), "Can only be set by a sealer");
        params[key]=value;
    }
}

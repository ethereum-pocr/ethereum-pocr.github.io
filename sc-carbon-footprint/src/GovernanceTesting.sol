// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceTesting is Governance {

  uint public currentTime = 1649253088;

  function getBlockConstantValues() override internal pure returns (uint blockDelayBeforeVote, uint blockSpanForVote) {
    blockDelayBeforeVote = 5;
    blockSpanForVote = 10;
  }




}
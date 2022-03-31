// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./Governance.sol";

contract GovernanceTesting is Governance {
  function getBlockConstantValues() override internal pure returns (uint blockDelayBeforeVote, uint blockSpanForVote) {
    blockDelayBeforeVote = 5;
    blockSpanForVote = 10;
  }
}
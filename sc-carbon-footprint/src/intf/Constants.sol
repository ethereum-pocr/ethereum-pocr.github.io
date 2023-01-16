// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

uint constant Const_BlockDelayBeforeVote = uint(keccak256("BlockDelayBeforeVote"));
uint constant Const_BlockSpanForVote = uint(keccak256("BlockSpanForVote"));
uint constant Const_MaxNbBlockPerPeriod = uint(keccak256("MaxNbBlockPerPeriod"));
uint constant Const_MinPledgeAmountWei = uint(keccak256("MinPledgeAmountWei"));
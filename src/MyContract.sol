// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Counters is Ownable {
  mapping (address=>uint) public counters;

  event Changed(address indexed counter, uint indexed valueBefore, uint indexed valueAfter);

  function increase() public {
    uint before = counters[_msgSender()];
    counters[_msgSender()] ++;
    emit Changed(_msgSender(), before, counters[_msgSender()]);
  }

  function reset() public {
    uint before = counters[_msgSender()];
    counters[_msgSender()] = 0;
    emit Changed(_msgSender(), before, counters[_msgSender()]);
  }
}
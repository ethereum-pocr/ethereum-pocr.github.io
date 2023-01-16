// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

import "./intf/INodeDelegation.sol";

contract NodeDelegation is INodeDelegation {
  mapping(address=>address) private _delegates;

  function allowDelegate(address delegate) public {
    require(delegate != address(0), "not a valid address");
    require(_delegates[delegate] == address(0), "the delegate address is already mapped to an address, reverting");
    _delegates[delegate] = msg.sender;
    emit NodeDelegationChanged(msg.sender, delegate, true);
  }
  function removeDelegate(address delegate) public {
    require(delegate != address(0), "not a valid address");
    require(_delegates[delegate] == msg.sender, "the delegate address is not mapped to the caller, reverting");
    delete _delegates[delegate];
    emit NodeDelegationChanged(msg.sender, delegate, false);
  }
  function delegateOf(address delegate) public view returns(address) {
    return _delegates[delegate];
  }
  function isDelegateOf(address node, address delegate) public view returns(bool) {
    return (_delegates[delegate] == node);
  }

}
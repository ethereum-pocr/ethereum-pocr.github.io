// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface INodeDelegation {

  function allowDelegate(address delegate) external;
  function removeDelegate(address delegate) external;
  function delegateOf(address delegate) external view returns(address);
  function isDelegateOf(address node, address delegate) external view returns(bool);
  event NodeDelegationChanged(address indexed node, address indexed delegate, bool status);
}
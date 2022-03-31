// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IPledgeContract {
  function pledge() external payable;
  function pledgedAmount(address owner) external view returns (uint);
  function transferPledge(address payable target, uint amount) external;
  event AmountPledged(address indexed from, uint amount, uint total);

  function confiscatedAmount() external view returns (uint);
  event PledgeConfiscated(address indexed from, uint amount, uint total);
  function createTransfer(address payable target, uint amount) external;
  function getTransferCount() external view returns (uint);
  function getTransfer(uint _index) external view returns (
      uint index, 
      uint amount,
      address payable target,
      uint nbApprovals,
      bool executed
    );
  function approveTransfer(uint index) external;
  function rejectTransfer(uint index) external;
  function executeTransfer(uint index) external;
  function cancelTransfer(uint index) external;
  enum TransferChangeStatus {Created, Approving, Rejecting, Executed, Cancelled}
  event TransferChanged(uint indexed index, TransferChangeStatus indexed status, uint approvals);
}
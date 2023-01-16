// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface IPledgeContract {
  function pledge() external payable;
  function pledgedAmount(address owner) external view returns (uint256);
  function transferPledge(address payable target, uint256 amount) external returns (bool);
  event AmountPledged(address indexed from, uint256 amountAdded, uint256 amountRemoved, uint256 total);

  function confiscatedAmount() external view returns (uint256);
  event PledgeConfiscated(address indexed from, uint256 amount, uint256 total);
  function createTransfer(address payable target, uint256 amount) external;
  function getTransferCount() external view returns (uint256);
  function getTransfer(uint256 _index) external view returns (
      uint256 index, 
      uint256 amount,
      address payable target,
      uint256 nbApprovals,
      bool executed
    );
  function approveTransfer(uint256 index) external;
  function rejectTransfer(uint256 index) external;
  function executeTransfer(uint256 index) external;
  function cancelTransfer(uint256 index) external;
  enum TransferChangeStatus {Created, Approving, Rejecting, Executed, Cancelled}
  event TransferChanged(uint256 indexed index, TransferChangeStatus indexed status, uint256 approvals);
}
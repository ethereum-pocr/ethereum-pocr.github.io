// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/IPledgeContract.sol";

contract PledgeContract is IPledgeContract {
  uint private _confiscatedAmount;
  mapping (address => uint) private pledgesAmountsByAuditor;
  struct TransferTx {
    uint index;
    address payable target;
    uint amount;
    uint nbApprovals;
    mapping (address => bool) approvals;
    bool completed;
  }
  uint private nbTransfers;
  mapping (uint => TransferTx) private transfers;

  function pledge() override public payable {
    pledgesAmountsByAuditor[msg.sender] += msg.value;
    emit AmountPledged(msg.sender, msg.value, pledgesAmountsByAuditor[msg.sender]);
  }
  // reject any direct transfer without an explicit pledge
  receive() external payable {
    revert();
  }
  // reject any direct transfer to an unknown method
  fallback() external payable {
    revert();
  }
  
  function pledgedAmount(address owner) override public view returns (uint) {
    return pledgesAmountsByAuditor[owner];
  }

  function canTransferPledge(address payable, uint) virtual internal view returns (bool) {
    return true;
  }
  function transferPledge(address payable target, uint amount) override public {
    require(amount <= pledgesAmountsByAuditor[msg.sender], "not enough funds");
    // test if the sender is a registered auditor and therefore test if it can remove its pledge
    require(canTransferPledge(target, amount), "not allowed to transfer pledge out");
    
    // now it is ok to transfer
    pledgesAmountsByAuditor[msg.sender] -= amount;
    target.transfer(amount);

  }

  /** to be called  */
  function confiscatePledge(address auditor) internal {
    uint amount =  pledgesAmountsByAuditor[auditor];
    if (amount == 0) {
      return;
    }
    _confiscatedAmount += amount;
    pledgesAmountsByAuditor[auditor] = 0;
    emit PledgeConfiscated(auditor, amount, _confiscatedAmount);
  }

  function confiscatedAmount() override public view returns (uint) {
    return _confiscatedAmount;
  }

  function canSenderOperateTransfer() virtual internal view returns (bool) {
    return true;
  }
  function createTransfer(address payable target, uint amount) override public {
    // who can create a transfer ?
    require(canSenderOperateTransfer(), "not allowed to create a transfer of confiscated pledge");
    // ensure there are enough confiscated amount
    require(_confiscatedAmount >= amount, "not enough funds");

    TransferTx storage t = transfers[nbTransfers];
    t.index = nbTransfers ++;
    t.target = target;
    t.amount = amount;
    _confiscatedAmount -= amount;
    // defaulted values for the following fields
    // t.nbApprovals = 0;
    // t.completed = false;
    emit TransferChanged(t.index, TransferChangeStatus.Created, 0);
  }

  function getTransferCount() override public view returns (uint) {
    return nbTransfers;
  }

  function getTransfer(uint _index) override public view returns (
      uint index, 
      uint amount,
      address payable target,
      uint nbApprovals,
      bool completed
    ) {
    require(_index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[_index];
    index = t.index;
    amount = t.amount;
    target = t.target;
    nbApprovals = t.nbApprovals;
    completed = t.completed;
  }

  function approveTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to approve a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "the transfer is already completed");
    
    if (t.approvals[msg.sender]) {
      // already approved
      return;
    } else {
      t.nbApprovals ++;
      t.approvals[msg.sender] = true;
      emit TransferChanged(t.index, TransferChangeStatus.Approving, t.nbApprovals);
    }
  }
  function rejectTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to reject a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "the transfer is already completed");

    if (t.approvals[msg.sender]) {
      // already approved
      t.nbApprovals --;
      t.approvals[msg.sender] = false;
      emit TransferChanged(t.index, TransferChangeStatus.Rejecting, t.nbApprovals);
    } else {
      return;
    }
  }

  function hasEnoughVote(uint) virtual internal view returns (bool) {
    return true;
  }

  function executeTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to execute a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "cannot execute the transfer");
    // test that the nb of approvals is greater than the number of nodes / 2 +1
    require(hasEnoughVote(t.nbApprovals), "not enough approvals");

    t.target.transfer(t.amount);
    t.completed = true;
    emit TransferChanged(t.index, TransferChangeStatus.Executed, t.nbApprovals);
  }
  function cancelTransfer(uint index) override public {
    // test that the caller is a valid node
    require(canSenderOperateTransfer(), "not allowed to cancel a transfer of confiscated pledge");
    
    require(index < nbTransfers, "invalid index");
    TransferTx storage t = transfers[index];
    require(!t.completed, "cannot cancel the transfer");
    
    _confiscatedAmount += t.amount;
    t.amount = 0;
    t.completed = true;
    emit TransferChanged(t.index, TransferChangeStatus.Cancelled, t.nbApprovals);
  }
  
}
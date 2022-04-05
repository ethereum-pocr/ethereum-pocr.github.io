// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/IPledgeContract.sol";

contract PledgeContract is IPledgeContract {


  uint public totalConfiscatedAmount;


  mapping (address => uint) public pledgesAmounts;

  event Log(string func, address sender, uint value, bytes data);


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


    pledgesAmounts[msg.sender] += msg.value;


    emit AmountPledged(msg.sender, msg.value, pledgesAmounts[msg.sender]);


  }



  // reject any direct transfer without an explicit pledge
  receive() external payable {
    emit Log("receive", msg.sender, msg.value, "");
    revert();
  }

  // reject any direct transfer to an unknown method
  fallback() external payable {
    emit Log("fallback", msg.sender, msg.value, msg.data);
    revert();
  }
  

  function pledgedAmount(address owner) override public view returns (uint) {
    return pledgesAmounts[owner];
  }


  function canTransferPledge(address payable, uint) virtual internal view returns (bool) {
    return true;
  }




  function transferPledge(address payable _target, uint _amount) public returns (bool){

    require(_amount <= pledgesAmounts[msg.sender], "not enough funds");

    // test if the sender is a registered auditor and therefore test if it can remove its pledge

    require(canTransferPledge(_target, _amount), "not allowed to transfer pledge out");
    
    pledgesAmounts[msg.sender] -= _amount;

    _target.transfer(_amount);

    return true;

  }



  /** to be called  */
  function confiscatePledge(address _auditor) internal {

    uint amount =  pledgesAmounts[_auditor];

    if (amount == 0) {
      return;
    }

    totalConfiscatedAmount += amount;

    pledgesAmounts[_auditor] = 0;

    emit PledgeConfiscated(_auditor, amount, totalConfiscatedAmount);

  }




  
    return totalConfiscatedAmount;
  


  function canSenderOperateTransfer() virtual internal view returns (bool) {
    return true;
  }


  //J'en suis ici de ma revue de code

  function createTransfer(address payable _target, uint _amount) override public {
    // who can create a transfer ?
    require(canSenderOperateTransfer(), "not allowed to create a transfer of confiscated pledge");

    // ensure there are enough confiscated amount
    require(totalConfiscatedAmount >= _amount, "not enough funds");

    TransferTx storage t = transfers[nbTransfers];
    t.index = nbTransfers ++;
    t.target = _target;
    t.amount = _amount;
    totalConfiscatedAmount -= _amount;

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
    
    totalConfiscatedAmount += t.amount;
    t.amount = 0;
    t.completed = true;
    emit TransferChanged(t.index, TransferChangeStatus.Cancelled, t.nbApprovals);
  }
  
}
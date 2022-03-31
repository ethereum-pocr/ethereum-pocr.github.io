// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract CarbonFootprint {
    mapping(address => uint) public footprint;
    uint public nbNodes;
    uint public totalFootprint;

    address public owner;

    function setFootprint(address node, uint value) public {
        // first get the current balance to make it as if we are removing
        uint current = footprint[node];
        if (current > 0) { // means node exists
            totalFootprint -= current;
            nbNodes -= 1;
            delete footprint[node];
        }
        // if value is zero then it is a node removal
        if (value >0) {
            footprint[node] = value;
            nbNodes += 1;
            totalFootprint += value;
        }
    }
    function setOwner(address newOwner) public {
        if (owner == address(0x0) || owner==msg.sender) {
            owner = newOwner;
        }
    }
}

// 0xb6c3dcf8 totalFootprint
// 0x03b2ec98 nbNodes
// 0x79f858160000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4 footprint
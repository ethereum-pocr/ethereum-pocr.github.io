// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./intf/ICarbonFootprint.sol";
import "./intf/IAuditorGovernance.sol";

/**
 * @notice
 * The objective of this contract is to enable the approved auditors
 * to set the footprint of the nodes they have audited
 *
 * @dev
 * This contract cannot have initializer or constructor
 * as its binary form will be embeded in the genesis block
 *
 * @dev
 * - footprint mapping receives the uint256 footprint of a address node
 * - nbNodes variable represents the number of nodes currently audited
 * - totalFootprint variable represents the sum of all node's footprint currently audited
 */

contract CarbonFootprint {

    /* nbNodes and sealers are never to be modified by the smart contract but by the client program (geth) 
        The objective for the geth program is to synchronize the actual sealers in the smart contract from the snapshot
        At each block, the consensus will check that the address at index is the same as in the snapshot and if not correct update the address
        Then update the total number of nodes.

        - pseudo code
        // start by removing missing sealers
        for i = 0 to nbNodes-1
            s = sealers[i]
            e = isSealer[s]
            if s not in snapshot.sealers then 
                isSealer[s] = false
                sealers[i] = zero
            
        // now force the replication of the snapshot
        for i = 0 to snapshot.sealers.length-1
            s = sealers[i]
            e = isSealer[snapshot.sealers[i]]
            if s != snapshot.sealers[i] then
                 sealers[i] = snapshot.sealers[i]
            if not e then
                 isSealer[snapshot.sealers[i]] = true
        
        // finally update the number of nodes
        nbNodes = snapshot.sealers.length      

    */
    uint256 public nbNodes; // set by geth program
    mapping(uint256 => address) public sealers; // 0..nbNodes-1, if it has a non zero address it is a sealer. set by geth program
    mapping(address => bool) public isSealer; // true is the address is a sealer. set by the geth program

    // updated by auditors 
    mapping(address => uint256) public footprint;

    // should be transformed into a function looping on the actual sealers
    // uint256 public totalFootprint;
    function totalFootprint() external view returns (uint) {
        uint total = 0;
        for (uint256 index = 0; index < nbNodes; index++) {
            total = total + footprint[sealers[index]];
        }
        return total;
    }

    event CarbonFootprintUpdate(address indexed node, uint256 footprint);

    /**
     * @notice
     * The objective of this function is to enable an auditor to set a node's
     * footprint after audit
     *
     * @dev
     * The caller of this function needs to :
     * - be approved
     * - be different that the address of the _node parameter
     */
    function setFootprint(address _node, uint256 _value) external {
        // Slither consider that me becomes an external contract but it is this contract so the reentrancy warning can be ignored
        IAuditorGovernance me = IAuditorGovernance(address(this));

        require(
            me.auditorSettingFootprint(msg.sender),
            "the caller is not authorized to set the carbon footprint"
        );
        require(
            msg.sender != _node,
            "the auditor cannot set its own footprint"
        );

        /** @dev
         * GET the current node's footprint */
        uint256 current = footprint[_node];

        /** @dev
         * IF the current node's footprint is equal to zero
         * and the _value set is superior to zero
         * THEN we set the node's footprint
         * and we increment nbNodes and totalFootprint */
        if ((current == 0) && (_value > 0)) {
            footprint[_node] = _value;
            // nbNodes += 1;
            // totalFootprint += _value;
        }

        /** @dev
         * IF the current node's footprint is superior to zero
         * and the _value set is superior to zero
         * THEN we update the node's footprint
         * and we update totalFootprint */
        if ((current > 0) && (_value > 0)) {
            footprint[_node] = _value;
            // totalFootprint -= current;
            // totalFootprint += _value;
        }

        /**
         * @notice 
         * this case represents the delete of a node
         * when _value = 0, it means we want to delete
         *
         * @dev
         * IF the current node's footprint is superior to zero
         * and the _value set is equal to zero
         * THEN we update the totalFootprint
         * and we decrement nbNodes
         * and wedelete the mapping entry - which technically set to zero the value*/
        if ((current > 0) && (_value == 0)) {
            // totalFootprint -= current;
            // nbNodes -= 1;
            delete footprint[_node];
        }

        emit CarbonFootprintUpdate(_node, _value);
    }
}

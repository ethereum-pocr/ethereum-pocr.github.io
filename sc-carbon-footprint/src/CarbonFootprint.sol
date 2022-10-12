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
    mapping(address => uint256) public footprint;
    mapping (uint256 => address) public indexedNodesAddresses;
    uint256 public nbNodes;
  
    uint256 public totalFootprint;

    event CarbonFootprintUpdate(address indexed node, uint256 footprint);

    function getFootprint(uint256 index)
     public
        view
        returns (
            address,
            uint256,
            bool
        )
    {
        if (index >= nbNodes)
            return (address(0),0,false);
        else
            return (indexedNodesAddresses[index], footprint[indexedNodesAddresses[index]],true);
    }

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
            nbNodes += 1;
            totalFootprint += _value;
            indexedNodesAddresses[nbNodes]=_node;
        }

        /** @dev
         * IF the current node's footprint is superior to zero
         * and the _value set is superior to zero
         * THEN we update the node's footprint
         * and we update totalFootprint */
        if ((current > 0) && (_value > 0)) {
            footprint[_node] = _value;
            totalFootprint -= current;
            totalFootprint += _value;
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
            totalFootprint -= current;
            indexedNodesAddresses[nbNodes]=address(0);
            nbNodes -= 1;
            delete footprint[_node];
        }

        emit CarbonFootprintUpdate(_node, _value);
    }
}

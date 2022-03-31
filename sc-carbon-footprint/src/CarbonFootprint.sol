// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

//import "./intf/ICarbonFootprint.sol";
//import "./intf/IAuditorGovernance.sol";




/** Contract cannot have initializer or constructor as its binary form will be embeded in the genesis block */
contract CarbonFootprint {

    mapping(address => uint) public footprint;

    uint public nbNodes;
    
    uint public totalFootprint;

    event CarbonFootprintUpdate(address indexed node, uint footprint);


    //in final version, we should define the function external as it is intended to be used with an UI exclusively (?)
    function setFootprint(address _node, uint _value) external {
        
        // IAuditorGovernance me = IAuditorGovernance(address(this));
        // Ensure that the sender is an authorized auditor
        // require(me.auditorSettingFootprint(msg.sender), "the caller is not authorized to set the carbon footprint");
        require(msg.sender != _node, "the auditor cannot set its own footprint"); 


        // Now we can set the footprint
        uint current = footprint[_node];



        //creation of a node and footprint setting
        if ((current == 0) && (_value > 0)) {
            footprint[_node] = _value;
            nbNodes += 1;
            totalFootprint += _value;
        }

        //update of a footprint node
        if ((current > 0) && (_value > 0)) {
            footprint[_node] = _value;
            totalFootprint -= current;
            totalFootprint += _value;
        }

       //delete of a footprint node
        if ((current > 0) && (_value ==  0)) {
            totalFootprint -= current;
            nbNodes -= 1;
            delete footprint[_node];
        }

 

        emit CarbonFootprintUpdate(_node, _value);
    }

}

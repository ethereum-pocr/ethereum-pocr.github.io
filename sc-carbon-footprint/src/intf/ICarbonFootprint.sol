// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface ICarbonFootprint {
  function setFootprint(address node, uint value) external; 
  function nbNodes() external view returns (uint);
  function totalFootprint() external view returns (uint);
  function footprint(address node) external view returns (uint);
  event CarbonFootprintUpdate(address indexed node, uint footprint);
}
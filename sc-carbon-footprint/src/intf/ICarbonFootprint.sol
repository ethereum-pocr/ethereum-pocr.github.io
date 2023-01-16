// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.17;

interface ICarbonFootprint {
  function setFootprint(address node, uint256 value) external; 
  function nbNodes() external view returns (uint256);
  function totalFootprint() external view returns (uint256);
  function footprint(address node) external view returns (uint256);
  event CarbonFootprintUpdate(address indexed node, uint256 footprint);
}
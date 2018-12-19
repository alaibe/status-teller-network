pragma solidity ^0.5.0;

interface ERCProxy {
  function proxyType() external pure returns (uint256 proxyTypeId);
  function implementation() external view returns (address codeAddr);
}
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 

contract AbiStore is Ownable {

  event SetABI(bytes32 bytecodeId, string abiIpfs);

  mapping(bytes32 => string) public abis;

  constructor() payable {
  }

  function setABI(bytes32 id, string memory abiIpfs) public onlyOwner {
      abis[id] = abiIpfs;
      emit SetABI(id, abiIpfs);
  }

  // to support receiving ETH by default
  receive() external payable { revert(); }
  fallback() external payable { revert(); }
}

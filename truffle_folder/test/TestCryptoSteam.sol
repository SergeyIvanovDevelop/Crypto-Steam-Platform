pragma solidity ^0.4.25;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

import "../contracts/CryptoSteam.sol";
import "../contracts/cryptostorage.sol";
import "../contracts/cryptomathadd.sol";
import "../contracts/cryptomathsub.sol";
import "../contracts/ownable.sol";

contract TestCryptoSteam {

function testMathAdd() public {
    CryptoSteam cryptoSteam = CryptoSteam(DeployedAddresses.CryptoSteam());
    uint256 result_add = cryptoSteam.my_add(5);
    uint expectedValue = 6;
    Assert.equal(result_add, expectedValue, "Value of 'result_add' should be equal 6");
  }

function testMathSub() public {
    CryptoSteam cryptoSteam = CryptoSteam(DeployedAddresses.CryptoSteam());
    uint256 result_sub = cryptoSteam.my_sub(40);
    uint expectedValue = 39;
    Assert.equal(result_sub, expectedValue, "Value of 'result_sub' should be equal 39");
  }
  
  
function testSetGetValue() public {
    CryptoSteam cryptoSteam = CryptoSteam(DeployedAddresses.CryptoSteam());
    cryptoSteam.setValue(77);
    uint expectedValue = 77;
    uint actualValue = cryptoSteam.getValue();
    Assert.equal(actualValue, expectedValue, "Value should be equal 77");
  }

function testSetGetString() public {
    CryptoSteam cryptoSteam = CryptoSteam(DeployedAddresses.CryptoSteam());
    cryptoSteam.setString("My test string");
    string memory expectedString = "My test string";
    string memory actualString = cryptoSteam.getString();
    Assert.equal(actualString, expectedString, "String should be equal 'My test string'");
  }
  

}

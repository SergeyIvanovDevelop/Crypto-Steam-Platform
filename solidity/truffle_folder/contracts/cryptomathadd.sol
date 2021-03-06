pragma solidity ^0.8.0;


contract CryptoMathAdd {

  event CallAdd (
    	uint256 before_,
    	uint256 after_
  );

  uint AddFee = 0.001 ether;
  
  function my_add(uint256 a) external payable returns (uint256) {
    uint256 res = a + 1;
    emit CallAdd(a, res);
    return res;
  }
  

}

pragma solidity >=0.4.22 <0.9.0;

import "./ownable.sol";

contract CryptoMathSub is Ownable {

    event CallSub (
    	uint256 before_,
    	uint256 after_
    );
    
   uint SubFee = 0.002 ether;

   function my_sub(uint256 a) external payable returns (uint256) {
  	uint256 res = a - 1;
  	emit CallSub(a, res);
  	return res;
  }

}

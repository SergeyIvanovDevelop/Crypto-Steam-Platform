pragma solidity >=0.4.22 <0.9.0;

import "./cryptomathadd.sol";
import "./cryptomathsub.sol";

contract CryptoStorage is CryptoMathAdd, CryptoMathSub {

    string savedString;
    uint savedValue;

    event ReceiveEth (
    	uint256 amountEth
    );

    function() external payable { 
    	emit ReceiveEth(msg.value);
    }
    
    function getBalance() public view returns( uint256 ) {
        return address(this).balance;
    }

    function setString( string memory newString ) public {
        savedString = newString;
    }
    
    function getString() public view returns( string memory ) {
        return savedString;
    }
    
    function setValue( uint newValue ) public {
        savedValue = newValue;
    }
    
    function getValue() public view returns( uint ) {
        return savedValue;
    }

}

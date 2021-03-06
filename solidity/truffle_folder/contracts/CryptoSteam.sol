pragma solidity >=0.8.0;

import "./cryptostorage.sol";
import "./ERC20.sol";
import "./IERC20.sol";

// Наш смарт-контракт одновременно является и ERC20 смарт-контрактом
contract CryptoSteam is CryptoStorage, ERC20('CryptoSteamToken', 'CST') {

    // Размещены в storage. За их создание и изменение необходимо платить gas
	// decimals всегда равен 18 в данной версии ERC20 от openzeppelin 
    address public smartContractCSTAddress;
    // Необходима для того, чтобы хранить заблокированные счета пользователей в данном смарт-контракте (напоминает блокчейн-мост, 
    // только мост позволяет переводить токены между сетями, а наш смарт-контракт - между другими смарт-контрактами ERC20 и нашим смарт-контрактом (как бы странно это не звучало)).
    // Формат: [ адрес пользователя : [адрес определенного смарт-контракта ERC20 : количество токенов данного контракта ERC20] ]
    // Т.е. это как бы внутренний счет пользователя в нашем смарт контракте, выраженный в произвольных токенах ERC20
    mapping (address => mapping (address => uint256)) internal _balancesCST;

    modifier onlyOwnerUser(address _addressUser) {
        require(_addressUser == msg.sender, "Only owner can withdraw wrapped ERC20 tokens");
        _;
    }

    event mintWERC20 (
    	address addressContractERC20,
        address indexed addressUser, 
        uint amountTokens
    );

    event burnWERC20 (
    	address addressContractERC20,
        address indexed addressUser, 
        uint amountTokens
    );

    event transferWERC20 (
    	address addressContractERC20,
        address indexed addressSender,
        address indexed addressReceiver, 
        uint amountTokens
    );

    event betCreate(
        string indexed gameID,
        address indexed addressUser,
        address addressContractERC20,
        uint amountTokens
    );

    event betJoin(
        string indexed gameID,
        address indexed addressUser,
        address addressContractERC20,
        uint amountTokens
    );

    event betRefundTokens(
        string indexed addressUserLostConnection,
        address indexed addressUser1,
        address addressContractERC20User1,
        uint amountTokensUser1,
        address indexed addressUser2,
        address addressContractERC20User2,
        uint amountTokensUser2
    );

    event betFinish (
        string indexed gameID,
        address indexed addressWinner,
        address indexed addressLoser
    );

    event stopContractCST ();

    event startContractCST ();

	constructor (address testMetaMaskWalletAddressRinkeby1, address testMetaMaskWalletAddressRinkeby2) public {
        // В данной версии ERC20 от openzeppelin _totalSupply не ограничен (при _mint для конкретного пользователя(адреса) общее количество выпущенных токенов увеличивается, при _burn - уменьшается)
        _mint(msg.sender, 9000000000000000000); // Для тестирования нужны
        _mint(testMetaMaskWalletAddressRinkeby1, 9000000000000000000); // Для тестирования нужны
        _mint(testMetaMaskWalletAddressRinkeby2, 9000000000000000000); // Для тестирования нужны
        smartContractCSTAddress = address(this);
    }

    function _putOnWrappedERC20TokensInCSTContract(address addressContractERC20, address addressUser, uint amountTokens) private returns (bool) { // Только серверая часть может начислять обернутые токены пользователям
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressUser != address(0), "addressUser must be valid");
        require(amountTokens > 0, "amountTokens must be > 0");
        _balancesCST[addressUser][addressContractERC20] = _balancesCST[addressUser][addressContractERC20] + amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        emit mintWERC20(addressContractERC20, addressUser, amountTokens);
        return true;
    }

    function putOnWrappedERC20TokensInCSTContract(address addressContractERC20, address addressUser, uint amountTokens) public onlyOwner() returns (bool) { // Только серверая часть может начислять обернутые токены пользователям
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressUser != address(0), "addressUser must be valid");
        require(amountTokens > 0, "amountTokens must be > 0");
        _balancesCST[addressUser][addressContractERC20] = _balancesCST[addressUser][addressContractERC20] + amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        emit mintWERC20(addressContractERC20, addressUser, amountTokens);
        return true;
    }

    function withdrawWrappedERC20TokensInCSTContract(address addressContractERC20, address addressUser, uint amountTokens) public onlyOwnerUser(addressUser) whenNotPaused returns(bool) { // Только пользователь-владелец может списывать обернутые токены со своего счета
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressUser != address(0), "addressUser must be valid");
        require(amountTokens > 0, "amountTokens must be > 0");
        require(amountTokens <= _balancesCST[addressUser][addressContractERC20], "There are not enough tokens on the account");
        _balancesCST[addressUser][addressContractERC20] = _balancesCST[addressUser][addressContractERC20] - amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        emit burnWERC20(addressContractERC20, addressUser, amountTokens);
        return true;
    }

    function transferWrappedERC20TokensToAnotherAddressInCSTContract(address addressContractERC20, address addressSender, address addressReceiver, uint amountTokens) public onlyOwnerUser(addressSender) whenNotPaused returns (bool) { // Только пользователь-владелец может списывать обернутые токены со своего счета
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressSender != address(0), "addressSender must be valid");
        require(addressReceiver != address(0), "addressReceiver must be valid");
        require(amountTokens > 0, "amountTokens must be > 0");
        require(amountTokens <= _balancesCST[addressSender][addressContractERC20], "There are not enough tokens on the account");
        _balancesCST[addressSender][addressContractERC20] = _balancesCST[addressSender][addressContractERC20] - amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        _balancesCST[addressReceiver][addressContractERC20] = _balancesCST[addressReceiver][addressContractERC20] + amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        emit transferWERC20(addressContractERC20, addressSender, addressReceiver, amountTokens);
        return true;
    }

    function transferWrappedERC20TokensFromCSTtoUsers(address addressContractERC20, address addressReceiver, uint amountTokens) public onlyOwner() returns (bool) { // Только пользователь-владелец может списывать обернутые токены со своего счета
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressReceiver != address(0), "addressReceiver must be valid");
        require(amountTokens > 0, "amountTokens must be > 0");
        require(amountTokens <= _balancesCST[address(this)][addressContractERC20], "There are not enough tokens on the account");
        _balancesCST[address(this)][addressContractERC20] = _balancesCST[address(this)][addressContractERC20] - amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        _balancesCST[addressReceiver][addressContractERC20] = _balancesCST[addressReceiver][addressContractERC20] + amountTokens; // SafeMath не использую, т.к. версия Solidity >=0.8.0
        emit transferWERC20(addressContractERC20, address(this), addressReceiver, amountTokens);
        return true;
    }

    function emitBetCreate(string memory gameID, address addressUser, address addressContractERC20, uint amountTokens) public onlyOwner() returns (bool) {
        emit betCreate(gameID, addressUser, addressContractERC20, amountTokens);
        return true;
    }

    function emitBetJoin(string memory gameID, address addressUser, address addressContractERC20, uint amountTokens) public onlyOwner() returns (bool) {
        emit betJoin(gameID, addressUser, addressContractERC20, amountTokens);
        return true;
    }

    function emitRefundTokens(string memory addressUserLostConnection,
                              address addressUser1,
                              address addressContractERC20User1,
                              uint amountTokensUser1,
                              address addressUser2,
                              address addressContractERC20User2,
                              uint amountTokensUser2) public onlyOwner() returns (bool) {
        emit betRefundTokens( addressUserLostConnection,
                              addressUser1,
                              addressContractERC20User1,
                              amountTokensUser1,
                              addressUser2,
                              addressContractERC20User2,
                              amountTokensUser2);
        return true;
    }

    function emitBetFinish(string memory gameID, address addressWinner, address addressLoser) public onlyOwner() returns (bool) {
        emit betFinish(gameID, addressWinner, addressLoser);
        return true;
    }

    function stopContract() public onlyOwner() returns (bool) {
        pause();
        emit stopContractCST();
        return true;
    }

    function startContract() public onlyOwner() returns (bool) {
        unpause();
        emit startContractCST();
        return true;
    }

    function getBalanceCST(address addressContractERC20, address addressUser) public view returns(uint) {
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(addressUser != address(0), "addressUser must be valid");
        return _balancesCST[addressUser][addressContractERC20];
    }

    function sendERC20TokensCST(address addressContractERC20, uint256 amount) public whenNotPaused returns(bool) {
        require(addressContractERC20 != address(0), "addressContractERC20 must be valid");
        require(amount > 0, "amount must be > 0");
        IERC20 contractERC20 = IERC20(addressContractERC20);
        require(contractERC20.balanceOf(msg.sender) >= amount, "balanceOf(msg.sender) must be more or equal amount");
        //require(contractERC20.approve(address(this), amount), "Approve FAILED"); // Нужно, чтобы отдельной транзакцией это делалось (до вызова sendERC20TokensCST)
        require(contractERC20.allowance(msg.sender, address(this)) >= amount, "allowance(msg.sender, address(this) must be >= amount");
        require(contractERC20.transferFrom(msg.sender, address(this), amount), "transferFrom FAILED");
        require(_putOnWrappedERC20TokensInCSTContract(addressContractERC20, msg.sender, amount), "_putOnWrappedERC20TokensInCSTContract FAILED");
        return true;
    }

    function getPaused() public view returns(bool) {
        return paused;
    }

}
    
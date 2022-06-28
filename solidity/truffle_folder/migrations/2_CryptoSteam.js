var MyContract = artifacts.require("CryptoSteam");
module.exports = function(deployer) {
	// deployment steps
	const testMetaMaskWalletAddressRinkeby1 = "0xEaA82262bE1A8Edf4742e4C2A45E308eb9A8D5cC";
	const testMetaMaskWalletAddressRinkeby2 = "0x217d3eEE02dfa63f595500d014Cdc70EAc2e2A02";
	deployer.deploy(MyContract, testMetaMaskWalletAddressRinkeby1, testMetaMaskWalletAddressRinkeby2);
};

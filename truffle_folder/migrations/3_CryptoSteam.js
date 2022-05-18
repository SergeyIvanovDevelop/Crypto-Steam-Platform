var MyContract = artifacts.require("CryptoSteam");
module.exports = function(deployer) {
	// deployment steps
	const testMetaMaskWalletAddressRinkeby = "0xEaA82262bE1A8Edf4742e4C2A45E308eb9A8D5cC";
	deployer.deploy(MyContract, testMetaMaskWalletAddressRinkeby);
};

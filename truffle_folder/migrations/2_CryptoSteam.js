var MyContract = artifacts.require("CryptoSteam");
module.exports = function(deployer) {
// deployment steps

deployer.deploy(MyContract);
};

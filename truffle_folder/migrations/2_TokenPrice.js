var MyContract = artifacts.require("TokenPrice");
module.exports = function(deployer) {
	// deployment steps
	deployer.deploy(MyContract);
};

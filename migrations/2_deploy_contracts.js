var GControl = artifacts.require("./CryptoCaesarControl.sol");

module.exports = function(deployer) {
    deployer.deploy(GControl);
};

const CryptoSteam = artifacts.require("CryptoSteam");

contract("cryptoSteam test", async accounts => {

    it("result_add should return 7", async() => {
        var instance = await CryptoSteam.deployed();
        var result_add = await instance.my_add.call(6);
        assert.equal(result_add.valueOf(), 7);
    });

    it("result_sub should return 39", async() => {
        var instance = await CryptoSteam.deployed();
        var result_sub = await instance.my_sub.call(40);
        assert.equal(result_sub.valueOf(), 39);
    });

    it("getValue should return 777", async() => {
        let instance = await CryptoSteam.deployed();
        await instance.setValue(777);
        let val = await instance.getValue.call();
        assert.equal(val.valueOf(), 777);
    });
    
    it("getString should return 'My test string'", async() => {
        let instance = await CryptoSteam.deployed();
        await instance.setString("My test string");
        let str = await instance.getString.call();
        assert.equal(str, "My test string");
    });

});

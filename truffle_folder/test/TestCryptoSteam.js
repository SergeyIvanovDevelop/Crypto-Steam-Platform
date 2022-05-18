const CryptoSteam = artifacts.require("CryptoSteam");

const addressSomeSmartContractERC20 = "0xD405831c18D9c4DFB283e3689f3569bc086Fe4E1";
contract("CryptoSteam test", async accounts => {
    let [owner, userAddress1, userAddress2] = accounts;
    // Выполнять данную функцию перед каждой функцией-тестом
    beforeEach(async () => {
        contractInstance = await CryptoSteam.new(owner);
    });

    it("Owner of contract should be able to mint wrapped ERC20 tokens for any address in CST smart-contract", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(result.receipt.status).to.equal(true);
        expect(balance.toNumber()).to.equal(amountTokens);
    });
    it("Not owner of contract should not be able to mint wrapped ERC20 tokens for any address in CST smart-contract", async () => {
        const amountTokens = 10;
        var result;
        try{
            result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: userAddress1});
        } catch {
            result = false;
        }
        expect(result).to.equal(false);
        //expect(result.receipt.status).to.equal(false);
    });

    it("Owner-user should be able to burn (for further withdrawal of real ERC20 tokens) wrapped ERC20 tokens in CST smart-contract", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        expect(result.receipt.status).to.equal(true);
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance.toNumber()).to.equal(amountTokens);
        // + 
        const amountTokensForWithdraw = 7;
        const amountTokensAfterWithdraw = 3;
        const result1 = await contractInstance.withdrawWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokensForWithdraw, {from: userAddress1});
        expect(result1.receipt.status).to.equal(true);
        const balance2 = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance2.toNumber()).to.equal(amountTokensAfterWithdraw);
    });
    it("User (and owner of conntract) should not be able to burn (for further withdrawal of real ERC20 tokens) wrapped ERC20 tokens of nother users in CST smart-contract", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        expect(result.receipt.status).to.equal(true);
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance.toNumber()).to.equal(amountTokens);
        // + 
        const amountTokensForWithdraw = 7;

        var result1;
        try {
            result1 = await contractInstance.withdrawWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokensForWithdraw, {from: userAddress2});
        } catch {
            result1 = false;
        }
        expect(result1).to.equal(false);
        var result2;
        try {
            result2 = await contractInstance.withdrawWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokensForWithdraw, {from: owner});
        } catch {
            result2 = false;
        }
        expect(result2).to.equal(false);
    });

    it("Owner-user should not be able to burn (for further withdrawal of real ERC20 tokens) wrapped ERC20 tokens in CST smart-contract more than he has", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        expect(result.receipt.status).to.equal(true);
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance.toNumber()).to.equal(amountTokens);
        // + 
        const amountTokensForWithdraw = 11;
        var result1;
        try {
            result1 = await contractInstance.withdrawWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokensForWithdraw, {from: userAddress1});
        } catch {
            result1 = false;
        }
        expect(result1).to.equal(false);
    });

    it("Owner-user should be able to transfer wrapped ERC20 tokens to any address in CST smart-contract", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        expect(result.receipt.status).to.equal(true);
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance.toNumber()).to.equal(amountTokens);
        // + 
        const amountTokensForTransfering = 6;
        const amountTokensAfterTransferUserAddress1 = 4;
        const amountTokensAfterTransferUserAddress2 = 6;
        const result1 = await contractInstance.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressSomeSmartContractERC20, userAddress1, userAddress2, amountTokensForTransfering, {from: userAddress1});
        expect(result1.receipt.status).to.equal(true);
        const balance1 = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance1.toNumber()).to.equal(amountTokensAfterTransferUserAddress1);
        const balance2 = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress2);
        expect(balance2.toNumber()).to.equal(amountTokensAfterTransferUserAddress2);
    });
    it("User (and owner of conntract) should not be able to transfer wrapped ERC20 tokens of other users to any address in CST smart-contract", async () => {
        const amountTokens = 10;
        const result = await contractInstance.putOnWrappedERC20TokensInCSTContract(addressSomeSmartContractERC20, userAddress1, amountTokens, {from: owner});
        expect(result.receipt.status).to.equal(true);
        const balance = await contractInstance.getBalanceCST.call(addressSomeSmartContractERC20, userAddress1);
        expect(balance.toNumber()).to.equal(amountTokens);
        // + 
        const amountTokensForTransfering = 6;
        var result1;
        try {
            result1 = await contractInstance.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressSomeSmartContractERC20, userAddress1, userAddress2, amountTokensForTransfering, {from: userAddress2});
        } catch {
            result1 = false;
        }
        expect(result1).to.equal(false);
        var result2;
        try {
            result2 = await contractInstance.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressSomeSmartContractERC20, userAddress1, userAddress2, amountTokensForTransfering, {from: owner});
        } catch {
            result2 = false;
        }
        expect(result2).to.equal(false);
    });

    it("Owner should be able to stop CST smart-contract", async () => {
        const result = await contractInstance.stopContract({from: owner});
        expect(result.receipt.status).to.equal(true);
    });
    it("Not owner should not be able to stop CST smart-contract", async () => {
        var result;
        try {
            result = await contractInstance.stopContract({from: userAddress1});
        } catch {
            result = false;
        }
        expect(result).to.equal(false);
    });

    it("Owner should be able to start CST smart-contract", async () => {
        const result = await contractInstance.startContract({from: owner});
        expect(result.receipt.status).to.equal(true);
    });
    it("Not owner should not be able to stop CST smart-contract", async () => {
        var result;
        try {
            result = await contractInstance.startContract({from: userAddress1});
        } catch {
            result = false;
        }
        expect(result).to.equal(false);
    });

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

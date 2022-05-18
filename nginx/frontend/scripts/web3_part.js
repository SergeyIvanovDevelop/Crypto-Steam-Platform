const cryptoSteamContractAddress = "0xD405831c18D9c4DFB283e3689f3569bc086Fe4E1";
var cryptoSteamContract;
var userMetaMaskAddress;
var web3;

async function sendERC20Tokens(addressContractERC20, addressSender, addressReciever, amountTokens) {
  // Создать объект контракта внешнего токена
  const ForeigenERC20Contract = new web3.eth.Contract(cryptoSteamContractABI, addressContractERC20); //cryptoSteamContractABI - уже является ERC20 ABI, т.к. мы наследуемся от смарт-контракта OpenZeppelin ERC20.
  
  // Вызвать функцию передачи токеноа данного смарт-контракта
  try {
    return await ForeigenERC20Contract.methods.transferFrom(addressSender, addressReciever, amountTokens) // if successfull - return 'true'
      .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
      .on("receipt", function (receipt) {
        if (receipt.receipt.status != true) {
          return false;
        }          
        console.log('receipt = ', receipt);
        console.log(`User's ERC20 tokens ("smart-contract address: ${addressContractERC20}") transfered to address of CST smart-contract in foreign ERC20 smart-contract`);
        return true;
      })
      .on("error", function (error) {
        console.log('tx_error = ', error);
        return false;
      });
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function withdrawWrappedERC20TokensInOurContract(addressContractERC20, addressUser, amountTokens) {
  try {
  return await cryptoSteamContract.methods.withdrawWrappedERC20TokensInOurContract(addressContractERC20, addressUser, amountTokens) // if successfull - return 'true'
    .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
    .on("receipt", function (receipt) {
      if (receipt.receipt.status != true) {
        return false;
      }
      console.log('receipt = ', receipt);
      console.log(`Burn WERC20 tokens ("smart-contract address: ${addressContractERC20}") finished successfull`);
      return true;
    })
    .on("error", function (error) {
      console.log('tx_error = ', error);
      return false;
    });
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20, addressSender, addressReceiver, amountTokens) {
  try {
      return await cryptoSteamContract.methods.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20, addressSender, addressReceiver, amountTokens) // if successfull - return 'true'
      .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
      .on("receipt", function (receipt) {
        if (receipt.receipt.status != true) {
          return false;
        }
        console.log('receipt = ', receipt);
        console.log(`Transfering WERC20 tokens ("smart-contract address: ${addressContractERC20}") finished successfull`);
        return true;
      })
      .on("error", function (error) {
        console.log('tx_error = ', error);
        return false;
      });
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function getBalanceCST(addressContractERC20, addressUser) {
  try {
      return await cryptoSteamContract.methods.getBalanceCST.call(addressContractERC20, addressUser) // if successfull - return 'true'
      .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
      .on("receipt", function (receipt) {
        if (receipt.receipt.status != true) {
          return false;
        }
        console.log('receipt = ', receipt);
        console.log(`Balance recieved`);
        //return true;
      })
      .on("error", function (error) {
        console.log('tx_error = ', error);
        return false;
      });
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function connectMetaMaskWallet() {
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
    console.log("Web3 loaded from MetaMask");
      try {
        await ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Yout MetaMask wallet connected");
      } catch (error) {
        console.log("Yout MetaMask wallet NOT connected");
        alert('Please install MetaMask wallet');
        console.error(error);
      }
  }
  cryptoSteamContract = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress);

  // Тут нужно адрес автоматически в переменную 'userMetaMaskAddress' занести

  console.log("web3.version = ", web3.version);
}
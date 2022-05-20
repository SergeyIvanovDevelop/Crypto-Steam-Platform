const cryptoSteamContractAddress = "0x8c290bB1d24BfeF90B8880EBb4584A0F8Cc165AC" //"0xA0Ab82e07f0D678b8Ed5eF8bDa0EBB54ABB759CD"; //"0xF0f43b4E04734a9aE51BfE174f4b28ab66d9e0e6";
var cryptoSteamContract;
var userMetaMaskAddress;
var web3;

async function sendERC20Tokens(addressContractERC20, addressSender, addressReciever, amountTokens) {
  // Создать объект контракта внешнего токена
  const ForeigenERC20Contract = new web3.eth.Contract(cryptoSteamContractABI, addressContractERC20); //cryptoSteamContractABI - уже является ERC20 ABI, т.к. мы наследуемся от смарт-контракта OpenZeppelin ERC20.
  
  // Вызвать функцию передачи токеноа данного смарт-контракта
  try {
    var userEthAddr = document.getElementById('user_eth_address');
    /*
    return await ForeigenERC20Contract.methods.transfer(addressReciever, amountTokens) // if successfull - return 'true'
      .send({ from: userEthAddr.value }) //, gas: 1000000 , gasPrice: 1000000000 })
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
      */
      var a = await web3.eth.sendTransaction({
        from: userEthAddr.value,
        to: addressContractERC20,
        gas: 2500000,
        data: ForeigenERC20Contract.methods.transfer(addressReciever, amountTokens).encodeABI()
      });
      console.log('a = ', a);
      return true;
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
      var receipt = await cryptoSteamContract.methods.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20, addressSender, addressReceiver, amountTokens).send({ from: addressSender, gas:4000000 , gasPrice: 1000000000 })
      /*
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
      */
      if (receipt.status != true) {
          return false;
        } else {return true;}
  } catch (error) {
    console.log('try/catch_error transfer= ', error);
    return false;
  }
}

async function getBalanceCST(addressContractERC20, addressUser) {
  try {
      var userEthAddr = document.getElementById('user_eth_address');
      var userMetaMaskAddress = userEthAddr.value;

      // ------------------ testing someone ---------------------------
      /*
      var a = await web3.eth.sendTransaction({
        from: userMetaMaskAddress,
        to: cryptoSteamContractAddress,
        gas: 2500000,
        data: cryptoSteamContract.methods.putOnWrappedERC20TokensInCSTContract(addressContractERC20, addressUser, 10).encodeABI()
      });
      */
      // ------------------ testing someone ---------------------------

      var currentBalance = await cryptoSteamContract.methods.getBalanceCST(addressContractERC20, addressUser).call();
      console.log('currentBalance = ', currentBalance);
      return currentBalance;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return -1;
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
  } else {
    alert("Please install the MetaMask extension in your browser");
    return;
  } 
  cryptoSteamContract = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress);

  // Тут нужно адрес автоматически в переменную 'userMetaMaskAddress' занести
  var userEthAddr = document.getElementById('user_eth_address');
  userEthAddr.value = ethereum.selectedAddress;
  console.log("Your MetaMask address = ", userEthAddr.value);
  console.log("web3.version = ", web3.version);


  // Запрашиваем баланс у смарт-контракта CST
  var addressContractERC20 = document.getElementById('contractTokenAddressBalance');
  const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
  if (currentBalance == -1) {
    var err = new Error("Unable to get balance");
    throw err;
  } else {
    var balanceField = document.getElementById('thisTokenBalance');
    balanceField.value = currentBalance;
  }

  // Разблокруем кнопки
  var buttonGameCreateJoin = document.getElementById('button1');
  buttonGameCreateJoin.disabled = false;
  var buttonDeposit = document.getElementById('depositButton');
  buttonDeposit.disabled = false;
  var buttonWithdraw = document.getElementById('button2');
  buttonWithdraw.disabled = false;

}


async function getContractNameToken(contractAdressERC20) {
  try {
    const contractERC20 = new web3.eth.Contract(cryptoSteamContractABI, contractAdressERC20);
    var nameToken = await contractERC20.methods.name().call();
    console.log('nameToken = ', nameToken);
    return nameToken;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return "UNKNOW"; 
  }
}

async function getContractSymbolToken(contractAdressERC20) {
  try {
    const contractERC20 = new web3.eth.Contract(cryptoSteamContractABI, contractAdressERC20);
    var symbolToken = await contractERC20.methods.symbol().call();
    console.log('symbolToken = ', symbolToken);
    return symbolToken;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return "UNKNOW";
    
  }
}

async function getContractDecimalsToken(contractAdressERC20) {
  try {
    const contractERC20 = new web3.eth.Contract(cryptoSteamContractABI, contractAdressERC20);
    var decimalsToken = await contractERC20.methods.decimals().call();
    console.log('decimalsToken = ', decimalsToken);
    return decimalsToken;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return "UNKNOW";
    
  }
}
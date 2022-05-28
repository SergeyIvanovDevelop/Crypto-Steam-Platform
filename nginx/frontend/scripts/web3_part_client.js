const cryptoSteamContractAddress = "0x38e910D088CfBC02388688b60165F588f971DFf6"
var cryptoSteamContract;
var userMetaMaskAddress;
var web3;

async function sendERC20Tokens(addressContractERC20, addressSender, addressReciever, amountTokens) {
  // Создать объект контракта внешнего токена
  const ForeigenERC20Contract = new web3.eth.Contract(cryptoSteamContractABI, addressContractERC20); //cryptoSteamContractABI - уже является ERC20 ABI, т.к. мы наследуемся от смарт-контракта OpenZeppelin ERC20.
  
  // Вызвать функцию передачи токеноа данного смарт-контракта
  try {
    var userEthAddr = document.getElementById('user_eth_address');
    var a = await web3.eth.sendTransaction({
      from: userEthAddr.value,
      to: addressContractERC20,
      gas: 2500000,
      data: ForeigenERC20Contract.methods.transfer(addressReciever, amountTokens).encodeABI()
    });
    console.log('a = ', a);
    return a;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function sendERC20TokensCST (addressContractERC20, addressSender, amountTokens) {
  const ForeigenERC20Contract = new web3.eth.Contract(cryptoSteamContractABI, addressContractERC20);
  const ContractCST = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress); //cryptoSteamContractABI - уже является ERC20 ABI, т.к. мы наследуемся от смарт-контракта OpenZeppelin ERC20.
  // Передача токенов данного смарт-контракта
  try {
    // Approve делаем одной транзакцией
    var receipt1 = await web3.eth.sendTransaction({
      from: addressSender,
      to: addressContractERC20,
      gas: 2500000,
      data: ForeigenERC20Contract.methods.approve(cryptoSteamContractAddress, amountTokens).encodeABI()
    });
    if (!receipt1.status) {
      customAlert('error', "Error transaction sendERC20TokensCST APPROVE ERC20");
      //alert('Error transaction sendERC20TokensCST APPROVE ERC20'); 
      return false; 
    }
    
    // Проверка allowance и минтинг токенов
    var receipt2 = await ContractCST.methods.sendERC20TokensCST(addressContractERC20, amountTokens).send({ from: addressSender, gas:4000000 , gasPrice: 1000000000 });
    console.log('receipt_sendERC20TokensCST = ', receipt2);
    if (!receipt2.status) {
      customAlert('error', "Error transaction sendERC20TokensCST");
      //alert('Error transaction sendERC20TokensCST');
      return false; 
    }
    return true;
  } catch (error) {
    console.log('try/catch_error = ', error);
    return false;
  }
}

async function withdrawWrappedERC20TokensInOurContract(addressContractERC20, addressUser, amountTokens) {
  try {
  return await cryptoSteamContract.methods.withdrawWrappedERC20TokensInOurContract(addressContractERC20, addressUser, amountTokens)
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
      var receipt = await cryptoSteamContract.methods.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20, addressSender, addressReceiver, amountTokens)
      .send({ from: addressSender, gas:4000000 , gasPrice: 1000000000 })
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
      customAlert('warning', "Please install MetaMask wallet");
      //alert('Please install MetaMask wallet');
      console.error(error);
    }
  } else {
    customAlert('warning', "Please install the MetaMask extension in your browser");
    //alert("Please install the MetaMask extension in your browser");
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

  // Проверка, является ли владелец данного кошелька создателем контракта
  if (await userIsOwner()) {
    console.log('User is admin');

    document.getElementById("adminInfo").value = " Some information only for admin ... ";
    document.getElementById("adminInfo").style.color = "purple";
    document.getElementById("buttonStartStopContract").disabled = false;
    
    if (await getPaused()) { 
      // Присваиваем цвет кнопки - зеленый, а надпись "START CONTRACT"
      document.getElementById("buttonStartStopContract").style.backgroundColor = "green";
      document.getElementById("buttonStartStopContract").value = "START SMART-CONTRACT";

      document.getElementById('button1').disabled = true;
      document.getElementById('button2').disabled = true;

    } else {
      // Присваиваем цвет кнопки - красный, а надпись "STOP CONTRACT"
      document.getElementById("buttonStartStopContract").style.backgroundColor = "red";
      document.getElementById("buttonStartStopContract").value = "STOP SMART-CONTRACT";

      document.getElementById('button1').disabled = false;
      document.getElementById('button2').disabled = false;
    }

    // Тут необходимо отобразить кнопку, которая при нажатии будет отображать панель с различной статистической информацией, доступной только для админа и кнопку для библиотеки PAUSABLE
    document.getElementById('showAdminPanel').style.display = "block";

    customAlert('info', "Hello admin ;)");
    //alert("Hello admin ;)");

  } else {
    console.log('User is not admin');
    if (await getPaused()) {
      // Выводим окно с черным экраном, которое нельзя закрыть с надписью о том, что на данный момент смарт-контракт остановлен разработчиками
      var stopContractForm = document.getElementById('stopContractForm');
      stopContractForm.style.backgroundColor = 'black';
      var hiddenForm2 = document.getElementById('hiddenForm2');
      hiddenForm2.style.backgroundColor = 'rgba(37, 37, 34, 0.8)';

      document.getElementById('stopContractForm').style.display = "block";
      document.getElementById('hiddenForm2').style.display = "block";

      // Выходим их функции
      return;
    } // Если контракт не остановлен, тогда ничего не делаем 
  }

  /*
  // Тестирование кастомных alert'ов
  customAlert("info", "textAlert1");
  customAlert("success", "textAlert2");
  customAlert("warning", "textAlert3");
  customAlert("error", "textAlert4");
  */

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

async function userIsOwner() {
  var userIsOwner = false;
  try {
      var userEthAddr = document.getElementById('user_eth_address');
      const userMetaMaskAddress = userEthAddr.value;
      const ContractCST = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress); 
      const ownerAddress = await ContractCST.methods.owner().call();
      console.log('ownerAddress = ', ownerAddress);
      console.log('userMetaMaskAddress = ', userMetaMaskAddress);
      userIsOwner = userMetaMaskAddress.toLowerCase() == ownerAddress.toLowerCase();
      return userIsOwner;
  } catch (error) {
    console.log('try/catch_error_userIsOwner = ', error);
    return userIsOwner;
  }
}

async function stopContract() {
  try {
    var userEthAddr = document.getElementById('user_eth_address');
    const ContractCST = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress); 
    const userMetaMaskAddress = userEthAddr.value;
    return await ContractCST.methods.stopContract()
    .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
    .on("receipt", function (receipt) {
      if (receipt.status != true) {
        return false;
      }
      console.log('receipt = ', receipt);
      console.log(`Contract stopped`);
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

async function startContract() {
  try {
    var userEthAddr = document.getElementById('user_eth_address');
    const ContractCST = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress); 
    const userMetaMaskAddress = userEthAddr.value;
    return await ContractCST.methods.startContract()
    .send({ from: userMetaMaskAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
    .on("receipt", function (receipt) {
      if (receipt.status != true) {
        return false;
      }
      console.log('receipt = ', receipt);
      console.log(`Contract started`);
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

async function getPaused() {
  const ContractCST = new web3.eth.Contract(cryptoSteamContractABI, cryptoSteamContractAddress); 
  const pausedContract = await ContractCST.methods.getPaused().call();
  console.log('pausedContract = ', pausedContract);
  return pausedContract;
}

async function switchStartStopContract() {
  const paused = document.getElementById('buttonStartStopContract').value;
  if (paused == "START SMART-CONTRACT") { // Если сейчас контракт остановлен
    const result = await startContract();
    if (!result) {
      console.log('Failed to start smart-contract');
      customAlert('error', "Failed to start smart-contract");
      //alert('Failed to start smart-contract');
      return false;
    }

    // Изменить цвет кнопки
    document.getElementById("buttonStartStopContract").style.backgroundColor = "red";
    // Сменить надпись на кнопке
    document.getElementById("buttonStartStopContract").value = "STOP SMART-CONTRACT";
    // Скрыть панель администратора
    document.getElementById('my_card_admin').style.display = "none";
    // Показать кнопку для вызова панели администратора
    document.getElementById('showAdminPanel').style.display = "block";
    
    document.getElementById('button1').disabled = false;
    document.getElementById('button2').disabled = false;

    console.log('Smart-contract launched successfully');
    customAlert('success', "Smart-contract launched successfully");
    //alert('Smart-contract launched successfully');
    return true;

  } else if(paused == "STOP SMART-CONTRACT") { // Если сейчас контракт запущен
    const result = await stopContract();
    if (!result) {
      console.log('Failed to stop smart-contract');
      customAlert('error', "Failed to stop smart-contract");
      //alert('Failed to stop smart-contract');
      return false;
    }

    // Изменить цвет кнопки
    document.getElementById("buttonStartStopContract").style.backgroundColor = "green";
    // Сменить надпись на кнопке
    document.getElementById("buttonStartStopContract").value = "START SMART-CONTRACT";
    // Скрыть панель администратора
    document.getElementById('my_card_admin').style.display = "none";
    // Показать кнопку для вызова панели администратора
    document.getElementById('showAdminPanel').style.display = "block";

    document.getElementById('button1').disabled = true;
    document.getElementById('button2').disabled = true;
    
    console.log('Smart-contract stopped successfully');
    customAlert('success', "Smart-contract stopped successfully");
    //alert('Smart-contract stopped successfully');
    return true;
  }
}
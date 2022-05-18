import { ChainId, Token, WETH, Fetcher, Route } from '@uniswap/sdk'

const Server = require('./server');

const unlock_password = "";
const creatorCSTAddress = "";

async function unclockAcc(userAccount, unlock_password) {
    var unlocked = await web3.eth.personal.unlockAccount(userAccount, unlock_password, 600);
    return unlocked;
}

async function sendERC20Tokens(addressContractERC20, addressSender, addressReciever, amountTokens) {
    // Создать объект контракта внешнего токена
    const ForeigenERC20Contract = new Server.web3.eth.Contract(Server.CryptoSteamABI, addressContractERC20); //cryptoSteamContractABI - уже является ERC20 ABI, т.к. мы наследуемся от смарт-контракта OpenZeppelin ERC20.
    // Вызвать функцию передачи токена данного смарт-контракта
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        // transferFrom - присутствует у всех ERC20 смарт-контрактов
        return await ForeigenERC20Contract.methods.transferFrom(addressSender, addressReciever, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
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


async function putOnWrappedERC20TokensInCSTContract(addressContractERC20, addressUser, amountTokens) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.putOnWrappedERC20TokensInCSTContract(addressContractERC20, addressUser, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
            return false;
          }
          console.log('receipt = ', receipt);
          console.log(`Mint WERC20 tokens ("smart-contract address: ${addressContractERC20}") finished successfull`);
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


async function withdrawWrappedERC20TokensInCSTContract(addressContractERC20, addressUser, amountTokens) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.withdrawWrappedERC20TokensInCSTContract(addressContractERC20, addressUser, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
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
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20, addressSender, addressReceiver, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
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



async function emitBetCreate(gameID, addressUser, addressContractERC20, amountTokens) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.emitBetCreate(gameID, addressUser, addressContractERC20, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
            return false;
          }
          console.log('receipt = ', receipt);
          console.log(`[emit BetCreate]`);
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

async function emitBetJoin(gameID, addressUser, addressContractERC20, amountTokens) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.emitBetJoin(gameID, addressUser, addressContractERC20, amountTokens) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
            return false;
          }
          console.log('receipt = ', receipt);
          console.log(`[emit BetJoin]`);
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

async function emitRefundTokens(addressUserLostConnection, addressUser1, addressContractERC20User1, amountTokensUser1, addressUser2, addressContractERC20User2, addressContractERC20, amountTokensUser2) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.emitRefundTokens(addressUserLostConnection, addressUser1, addressContractERC20User1, amountTokensUser1, addressUser2, addressContractERC20User2, addressContractERC20, amountTokensUser2) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
            return false;
          }
          console.log('receipt = ', receipt);
          console.log(`[emit RefundTokens]`);
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

async function emitBetFinish(gameID, addressWinner, addressLoser) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.emitBetFinish(gameID, addressWinner, addressLoser) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
            return false;
          }
          console.log('receipt = ', receipt);
          console.log(`[emit BetFinish]`);
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

async function stopContract() {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.stopContract() // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
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
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.startContract() // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
        .on("receipt", function (receipt) {
          if (receipt.receipt.status != true) {
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

async function getBalanceCST(addressContractERC20, addressUser) {
    try {
        var unlocked = await Server.web3.eth.personal.unlockAccount(creatorCSTAddress, unlock_password, 600);
        console.log("unlocked: ", unlocked);
        return await Server.CSTContract.methods.getBalanceCST.call(addressContractERC20, addressUser) // if successfull - return 'true'
        .send({ from: creatorCSTAddress }) //, gas: 1000000 , gasPrice: 1000000000 })
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

async function getTokensPrices(addressToken0, decimalToken0, chainIdToken0, addressToken1, decimalToken1, chainIdToken1) {
  const token0 = new Token(chainIdToken0, addressToken0, decimalToken0); //(нужно знать это значение, чтобы првильно считать)
  const token1 = new Token(chainIdToken1, addressToken1, decimalToken1);
  const pair = await Fetcher.fetchPairData(token1, token0);
  const route = new Route([pair], token0);
  const numberOfToken1perOneToken0 = route.midPrice.toSignificant(6);
  const numberOfToken0perOneToken1 = route.midPrice.invert().toSignificant(6);
  console.log(`1 token1 = ${numberOfToken0perOneToken1} token0`);
  console.log(`1 token0 = ${numberOfToken1perOneToken0} token1`);
  // Если мы будем всегда передавать в качестве addressToken1 - USDT, то тогда на нужно будет использовать numberOfToken0perOneToken1, т.е. array[0]
  return [numberOfToken0perOneToken1, numberOfToken1perOneToken0];
}



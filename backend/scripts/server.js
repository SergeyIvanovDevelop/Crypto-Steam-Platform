const WebSocket = require('ws');
const handlerFrontend = require('./handler_frontend')
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectId; 
const Web3 = require('web3');
const CryptoSteamABI = require('./CryptoSteamABI');
const express = require('express');
var cors = require('cors');
const addressContractCST = "0x38e910D088CfBC02388688b60165F588f971DFf6"
const Blockchain = require('./web3_part')
const MongoDB = require('./interaction_DataBase');

async function main() {
  const wsServer = new WebSocket.Server({port: 9000}); 
  console.log('Server running on port 9000');
  wsServer.on('connection', handlerFrontend.onConnect);
  const wsServerPerform = new WebSocket.Server({port: 9001});
  console.log('Server for games running on port 9001');
  wsServerPerform.on('connection', handlerFrontend.onConnectPerform);
  const url = "mongodb://172.17.0.1:27017/";
  const mongoClient = new MongoClient(url);
  await mongoClient.connect();
  const db = mongoClient.db("admin");
  db.createCollection("ApprovedBlockNumberTransactionInfo");
  const mapWSClients = new Map();
  web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:9545')); //'wss://rinkeby.infura.io/ws/v3/211015611c0a4b4baa0747b15079861b'));
  //web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  console.log("Web3 loaded");
  console.log("web3.version = ", web3.version);
  const CSTContract = new web3.eth.Contract(CryptoSteamABI.cryptoSteamContractABI, addressContractCST);
  const app = express();
  const PORT = 8080;
  app.use(express.json());
  app.use(cors());
  app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));
  app.post('/getPrices', (request, response) => {
  const addressToken0 = request.body.addressToken0;
  const amountToken0 = request.body.amountToken0;
  const decimalsToken0 = request.body.decimalsToken0;

  const addressToken1 = request.body.addressToken1;
  const amountToken1 = request.body.amountToken1;
  const decimalsToken1 = request.body.decimalsToken1;

  // Сеть develop принимает запросы к любым ID сетей (согласно конфигу truffle)
  const chainIdToken0 = Blockchain.ChainId.RINKEBY;
  const chainIdToken1 = Blockchain.ChainId.RINKEBY;

  const contractAddressUSDT = "0x425c7E0DcFf90D9d61b1915363691a1B890831fC";
  var prices = Blockchain.getTokensPrices(addressToken0, decimalToken0, chainIdToken0, contractAddressUSDT, decimalToken1, chainIdToken1); // decimalToken0 / decimalToken1 - специально неправильные
  var numberUSDTperOneToken0 = prices[0];
  prices = Blockchain.getTokensPrices(addressToken1, decimalToken0, chainIdToken0, contractAddressUSDT, decimalToken1, chainIdToken1); // decimalToken0 / decimalToken1 - специально неправильные
  var numberUSDTperOneToken1 = prices[0];
  response.status(200);
  response.json({
          "numberUSDTperOneToken0": numberUSDTperOneToken0,
          "numberUSDTperOneToken1": numberUSDTperOneToken1
      });
  });
  app.post('/approveTransaction', async function (request, response) {
  const receipt = request.body.receipt;
  const contractAddress = request.body.contractAddress;
  const addressUser = request.body.addressUser;
  const amount = request.body.amount;
  // В этой функции и происходит зачисление обернутых средств пользователю
  var confirm = await approveTransaction(receipt, contractAddress, addressUser, amount);

  response.status(200);
  response.json({
          "confirm": confirm
      });
  });
  app.post('/approveWithdraw', async function (request, response) {
  const receipt = request.body.receipt;
  const contractAddress = request.body.contractAddress;
  const addressUser = request.body.addressUser;
  const amount = request.body.amount;
  // В этой функции и происходит зачисление обернутых средств пользователю
  var confirm = await approveWithdraw(receipt, contractAddress, addressUser, amount);

  response.status(200);
  response.json({
          "confirm": confirm
      });
  });

  exports.mongoClient = mongoClient;
  exports.ObjectId = ObjectId;
  exports.db = db;
  exports.mapWSClients = mapWSClients;
  exports.web3 = web3;
  exports.CSTContract = CSTContract;
  exports.CryptoSteamABI = CryptoSteamABI.cryptoSteamContractABI;
}

async function approveTransaction(receipt, contractAddress, addressUser, amount) {
  // Тут проверка 'receipt', если все хорошо, то зачисляет токены CRT для ERC20 пользователю
  var resultPutOn = "undefined";
  var blockNumber = receipt.blockNumber;
  console.log('blockNumber = ', blockNumber);
  const ERC20Contract = new web3.eth.Contract(CryptoSteamABI.cryptoSteamContractABI, contractAddress);
  var result = await ERC20Contract.events.Transfer({
      filter: {from: addressUser, to: addressContractCST},
      fromBlock: blockNumber
      }, async function(error, event) {
          console.log(">>> Event_approveTransaction: " +  event)
          console.log(event);
          console.log('[ !!! returnValues !!! ] = ', event.returnValues);
          console.log('[ !!! returnValues.value !!! ] = ', event.returnValues.value);
          console.log('[ !!! returnValues[2] !!! ] = ', event.returnValues[2]);
          if (parseInt(event.returnValues.value) == amount) {
            var approvedBlockNumberTransactionInfo = { "blockNumber" : receipt.blockNumber , 'contractAddressERC20' : receipt.contractAddress, 'addressUser' : receipt.addressUser, 'amountTokens' : receipt.amount};
            const collectionName = "ApprovedBlockNumberTransactionInfo";
            // Проверяем нет ли уже в БД подтвержденного блока с таким номером для данной информации
            const resCheck = await MongoDB.checkBlockNumberTransactionInfo(approvedBlockNumberTransactionInfo, collectionName);
            if (!resCheck) {
              console.log("[Error]: this transaction has already been confirmed by the server");
              return false;
            }
            console.log("[Success]: this transaction has not already been confirmed by the server");
            // Вносим в БД данную информацию
            await MongoDB.addDocumentToCollection(approvedBlockNumberTransactionInfo, collectionName);

            // Минтим токены для данного пользователя
            resultPutOn = await Blockchain.putOnWrappedERC20TokensInCSTContract(contractAddress, addressUser, amount);
          } else {
            resultPutOn = false;
          }
      }).on('data', (event) => {
      console.log('– >>> Event approveTransaction fired')
      console.log(event);
      }).on('changed', (event) => {
        console.log(' > changed')
        console.log(event)
      }).on('error', console.error);
      setTimeout(function() { 
        console.log('wait resultPutOn ...');
        console.log('resultPutOn = ', resultPutOn);
      }, 10000);
      console.log('result_ERC20Contract = ', result);
      return resultPutOn;
}

async function approveWithdraw(receipt, contractAddress, addressUser, amount) {
  var resultWithdraw = await Blockchain.sendERC20Tokens(contractAddress, Blockchain.creatorCSTAddress, addressUser, amount);
  console.log('resultWithdraw = ', resultWithdraw);
  return resultWithdraw;
}

main();
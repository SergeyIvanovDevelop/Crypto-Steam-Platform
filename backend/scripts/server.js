const WebSocket = require('ws');
const handlerFrontend = require('./handler_frontend')
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectId; 
const Web3 = require('web3');
const CryptoSteamABI = require('./CryptoSteamABI');
const express = require('express');
var cors = require('cors');
const addressContractCST = "0x8c290bB1d24BfeF90B8880EBb4584A0F8Cc165AC" //"0xA0Ab82e07f0D678b8Ed5eF8bDa0EBB54ABB759CD";
const Blockchain = require('./web3_part')

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
  const mapWSClients = new Map();
  //web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:9545')); //'wss://rinkeby.infura.io/ws/v3/211015611c0a4b4baa0747b15079861b'));
  web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
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

  // Сеть develop принимает запросы к любым сетям (согласно конфигу truffle)
  const chainIdToken0 = Blockchain.ChainId.RINKEBY;
  const chainIdToken1 = Blockchain.ChainId.RINKEBY;

  const contractAddressUSDT = "0x425c7E0DcFf90D9d61b1915363691a1B890831fC";
  var prices = Blockchain.getTokensPrices(addressToken0, decimalToken0, chainIdToken0, contractAddressUSDT, decimalToken1, chainIdToken1);
  var numberUSDTperOneToken0 = prices[0];
  prices = Blockchain.getTokensPrices(addressToken1, decimalToken0, chainIdToken0, contractAddressUSDT, decimalToken1, chainIdToken1);
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
  var resultPutOn = await Blockchain.putOnWrappedERC20TokensInCSTContract(contractAddress, addressUser, amount);
  console.log('resultPutOn = ', resultPutOn);
  return resultPutOn;
}

async function approveWithdraw(receipt, contractAddress, addressUser, amount) {
  // Тут проверка 'receipt', если все хорошо, то зачисляет токены CRT для ERC20 пользователю
  var resultWithdraw = await Blockchain.sendERC20Tokens(contractAddress, Blockchain.creatorCSTAddress, addressUser, amount);
  console.log('resultWithdraw = ', resultWithdraw);
  return resultWithdraw;
}

main();
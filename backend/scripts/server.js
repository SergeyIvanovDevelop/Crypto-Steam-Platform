const WebSocket = require('ws');
const handlerFrontend = require('./handler_frontend')
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectId; 
const Web3 = require('web3');
const CryptoSteamABI = require('./CryptoSteamABI');
const express = require('express');
var cors = require('cors');
const addressContractCST = "";

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
  web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://rinkeby.infura.io/ws/v3/211015611c0a4b4baa0747b15079861b`));
  //web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  console.log("Web3 loaded");
  console.log("web3.version = ", web3.version);
  const CSTContract = new Server.web3.eth.Contract(CryptoSteamABI.CryptoSteamABI, addressContractCST);
  const app = express();
  const PORT = 8080;
  app.use(express.json());
  app.use(cors());
  app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));




  exports.mongoClient = mongoClient;
  exports.ObjectId = ObjectId;
  exports.db = db;
  exports.mapWSClients = mapWSClients;
  exports.web3 = web3;
  exports.CSTContract = CSTContract;
  exports.CryptoSteamABI.CryptoSteamABI = CryptoSteamABI;
  exports.app = app;
}

main();
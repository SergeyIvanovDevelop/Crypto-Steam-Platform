const WebSocket = require('ws');
const handlerFrontend = require('./handler_frontend')
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongodb').ObjectId; 

async function main() {
  const wsServer = new WebSocket.Server({port: 9000}); 
  console.log('Server running on port 9000');
  wsServer.on('connection', handlerFrontend.onConnect);
  const wsServerPerform = new WebSocket.Server({port: 9001});
  console.log('Server for games running on port 9001');
  wsServerPerform.on('connection', handlerFrontend.onConnectPerform);
  const url = "mongodb://localhost:27017/";
  const mongoClient = new MongoClient(url);
  await mongoClient.connect();
  const db = mongoClient.db("admin");
  const mapWSClients = new Map();

  exports.mongoClient = mongoClient;
  exports.ObjectId = ObjectId;
  exports.db = db;
  exports.mapWSClients = mapWSClients;
}

main();
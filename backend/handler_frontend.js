const { Server } = require('ws');
const myServer = require('./server');
const MongoDB = require('./interaction_DataBase');
const gamesID = new Map();

async function onConnect(wsClient) {
  wsClient.on('message', async function(message) {
    await processClientMessage(wsClient, message);
  });

  wsClient.on('close', function() {
    var ipAddrConnectedClient = wsClient._socket.remoteAddress;
    var ipPortConnectedClient = wsClient._socket.remotePort;
    console.log('User disconnected');
    console.log('ipClosedConnection: ',ipAddrConnectedClient);
    console.log('portClosedConnection: ',ipPortConnectedClient);
  });
}



async function onConnectPerform(wsClient) {
  var gameId;
  console.log('New client in the game');
  var ipAddrConnectedClient = wsClient._socket.remoteAddress;
  var ipPortConnectedClient = wsClient._socket.remotePort;
  console.log('IP: ',ipAddrConnectedClient);
  console.log('Port: ',ipPortConnectedClient);

  wsClient.on('message', async function(message) {
    /* обработчик сообщений от клиента */
    gameId = await processClientMessagePerform(wsClient, message);
    if (gameId != "perform")
    {
      gamesID.set(wsClient._socket.remotePort, gameId);
      console.log('GameId = ', gameId);
    }
    
  });

  wsClient.on('close', async function() {
    var ipAddrConnectedClient = wsClient._socket.remoteAddress;
    var ipPortConnectedClient = wsClient._socket.remotePort;
    console.log('User disconnected');
    console.log('ipClosedConnection: ',ipAddrConnectedClient);
    console.log('portClosedConnection: ',ipPortConnectedClient);

    // Проверяем, завершена ли игра
    const gameId_ = gamesID.get(wsClient._socket.remotePort);
    gamesID.delete(wsClient._socket.remotePort);
    const collectionName = "Pending_Games";
    const gameFinished = await MongoDB.isGameFinished(gameId_, collectionName);
    console.log('gameFinished_test = ', gameFinished);
    if (!gameFinished) {
      // Значит соединение оборвалось во время игры и необходимо вернуть деньги (даже если был только один игрок пока в игре)
      // ...
      // Записать эти данные в блокчейн !
      // И чеки возврата тоже, все, все, все
      console.log('Return money to all users in this game...');
    }
  });
}

// Это на будущее, вдруг пригодится
async function processClientMessage(wsClient, message) {
  try {

  } catch (error) {
    console.log('Error', error);
  }
}
  
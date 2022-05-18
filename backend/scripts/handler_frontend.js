const { Server } = require('ws');
const myServer = require('./server');
const MongoDB = require('./interaction_DataBase');
const Blockchain = require('./web3_part');
const gamesID = new Map();

async function onConnect(wsClient) {
  console.log('New Client.');
  await MongoDB.ping();
  var ipAddrConnectedClient = wsClient._socket.remoteAddress;
  var ipPortConnectedClient = wsClient._socket.remotePort;
  console.log('IP: ',ipAddrConnectedClient);
  console.log('Port: ',ipPortConnectedClient);
  sendUpdatedListPendingGamesTimeout(wsClient);

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
  console.log('New Client in Game.');
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
  const collectionName = "Pending_Games";
  const gameFinished = await MongoDB.isGameFinished(gameId_, collectionName);
  console.log('gameFinished_test = ', gameFinished);
  if (!gameFinished) {
    // Удалить её из списка отображаемых
    await MongoDB.updateGameStarted(gameId_, collectionName)
    const addrWin_ = "nobody";
    await MongoDB.updateGameFinished(gameId_, collectionName, addrWin_);
    var addr1 = await MongoDB.getAddr(gameId_, collectionName, 1);
    var addr2 = await MongoDB.getAddr(gameId_, collectionName, 2);

    // Формируем JSON для отправки
    // Для совместимости
    var generalJSON_ = {};

    var connectionLostJSON = { 
      whatIsIt: 'opponentLostConnection',
      generalJSON: generalJSON_ 
    };

    // Заппрашиваем WS игроков
    const wsAddr1 = myServer.mapWSClients.get(addr1);
    const wsAddr2 = myServer.mapWSClients.get(addr2);

    myServer.mapWSClients.delete(addr1);
    myServer.mapWSClients.delete(addr2);
 
    try {
      await wsAddr1.send(JSON.stringify(connectionLostJSON));
      await wsAddr1.close();
      console.log('Sending lost connection to addr1 = ', addr1);
    } catch (e) {
      console.log('Disconnected address #1 (creator of game): ', addr1);
    }
    try {
      await wsAddr2.send(JSON.stringify(connectionLostJSON));
      await wsAddr2.close();
      console.log('Sending lost connection to addr2 = ', addr2);
    } catch (e) {
      console.log('Disconnected address #2 (joined user): ', addr2);
    }
    // Запрашиваем адресс соперника и отправляем ему оповещение
    // Для упрошения по gameID запросим оба адреса и через try/catch отправим оповещение (чтобы программа не упала)

    // Значит соединение оборвалось во время игры и необходимо вернуть деньги (даже если был только один игрок пока в игре)
    // ...
    // Записать эти данные в блокчейн !
    // И чеки возврата тоже, все, все, все
    console.log('Return money to all users in this game ...');
  }
  gamesID.delete(wsClient._socket.remotePort);
  });
}

// Это на будущее, вдруг пригодится
async function processClientMessage(wsClient, message) {
  try {
    

  } catch (error) {
    console.log('Error', error);
  }
}

async function processClientMessagePerform(wsClient, message) {
  try {
    // сообщение пришло текстом, нужно конвертировать в JSON-формат
    const jsonMessage = JSON.parse(message);
    console.log('jsonMessage: ', jsonMessage);

    const whatIsIt = jsonMessage.whatIsIt;
    const documentJSON = jsonMessage.generalJSON;
    const collectionName = "Pending_Games";

    console.log('check_documentJSON = ', documentJSON);

    console.log('whatIsIt = |%s|', jsonMessage.whatIsIt);
    switch (whatIsIt) {
      case 'create':
        // Добавляем пару 'addr1': WebSocket в глобальную map
        myServer.mapWSClients.set(documentJSON.addr1, wsClient);

        // Добавляем запись в БД
        const gameID = await MongoDB.addDocumentToCollection(documentJSON, collectionName);

        // Формируем JSON для отправки
        var generalJSON_ = { 
          gameID: gameID, 
        };

        var createdGameJSON = { 
          whatIsIt: 'gameCreated',
          generalJSON: generalJSON_ 
        };

        await wsClient.send(JSON.stringify(createdGameJSON));
        console.log('Created game with ID = ', gameID.toString());

        // Передать полученный ID в область видимости обработчика данного WebSocket-оединения
        return gameID;
        break;
      case 'attach':
        // Добавляем пару 'addr1': WebSocket в глобальную map
        myServer.mapWSClients.set(documentJSON.addr2, wsClient);

        const updateStatus = await MongoDB.updateDocumentByIdAttach(documentJSON.gameID, documentJSON, collectionName);
        console.log("updateStatus = ", updateStatus);
        // Получить адрес первого игрока
        const revialAddress = await MongoDB.getAddrOfRival(documentJSON.gameID, collectionName, documentJSON.addr2);
        console.log("revialAddress = ", revialAddress);
        
        // Формируем JSON для отпрвки противнику
        var generalJSON_ = { 
          revialAddress: documentJSON.addr2, 
          kindTokenOfDeposit: documentJSON.addr2_kindTokenOfDeposit,
          amountOfDeposit: documentJSON.addr2_amountOfDeposit,
          timeOfLockingDeposit: documentJSON.addr2_timeOfLockingDeposit 
        };

        var JSON_toRevial = { 
          whatIsIt: 'gameAttached',
          generalJSON: generalJSON_ 
        };

        // Получить полный JSON
        const fullDocumentJSON = await MongoDB.getDocumentById(documentJSON.gameID, collectionName);

        // Формируем JSON для отправки себе
        var generalJSON_toMyself_ = { 
          revialAddress: fullDocumentJSON.addr1, 
          kindTokenOfDeposit: fullDocumentJSON.addr1_kindTokenOfDeposit,
          amountOfDeposit: fullDocumentJSON.addr1_amountOfDeposit,
          timeOfLockingDeposit: fullDocumentJSON.addr1_timeOfLockingDeposit
        };

        var JSON_toMyself = { 
          whatIsIt: 'gameAttached',
          generalJSON: generalJSON_toMyself_ 
        };

        // Добавить в БД запись о том, что игра началась
        await MongoDB.updateGameStarted(documentJSON.gameID, collectionName);

        // Сервер загадывает число
        await MongoDB.thinkNumber(documentJSON.gameID, collectionName);

        // Получить WebSocket, привязанный на данный момент к данному адресу
        const wsRevial = myServer.mapWSClients.get(revialAddress);

        // Отправить JSON противнику
        await wsRevial.send(JSON.stringify(JSON_toRevial));

        // Отправить JSON самому себе
        await wsClient.send(JSON.stringify(JSON_toMyself));

        console.log('Game started!');

        // Передать полученный ID в область видимости обработчика данного WebSocket-оединения
        return documentJSON.gameID.toString();
        break;
      case 'perform':
        // Обработка ходов игроков
        // Получить полный JSON
        const fullDocumentJSON_ = await MongoDB.getDocumentById(documentJSON.gameID, collectionName);

        // Игрок присылает gameId, адрес свой и число, которое он думалет, что загадал сервер
        if (fullDocumentJSON_.addr1 == documentJSON.ownAddress) {
          // Бобавить в БД, что первый игрок походил
          await MongoDB.performedDigit(documentJSON.gameID, collectionName, 1, documentJSON.digit);
      } else if (fullDocumentJSON_.addr2 == documentJSON.ownAddress) {
          // Бобавить в БД, что второй игрок походил
          await MongoDB.performedDigit(documentJSON.gameID, collectionName, 2, documentJSON.digit);
      } else {
          var err = new Error("func 'case _perform_': Wrong address");
          throw err;
      }

      // Проверяем оба ли игрока походили
      const fullDocumentJSONCheckEndGame = await MongoDB.getDocumentById(documentJSON.gameID, collectionName);  
      if ( (fullDocumentJSONCheckEndGame.addr1_performed != -1) && (fullDocumentJSONCheckEndGame.addr2_performed != -1) )
      {
        // Определяем победителя
        /// Получение разности числа addr1 и загаданного сервером
        const addr1_Diff = Math.abs(fullDocumentJSONCheckEndGame.addr1_performed - fullDocumentJSONCheckEndGame.thinkedNumber);
        console.log('addr1_Diff = ', addr1_Diff);

        /// Получение разности числа addr2 и загаданного сервером
        const addr2_Diff = Math.abs(fullDocumentJSONCheckEndGame.addr2_performed - fullDocumentJSONCheckEndGame.thinkedNumber);
        console.log('addr2_Diff = ', addr2_Diff);

        /// Сравнение разностей
        var addrWin_;
        var addrLose_;
        var addrLoseDigit_;
        var addrWinDigit_;

        // У addr1 приоритет при одинаковых числах, так как инициировал ставку
        if (addr1_Diff <= addr2_Diff) {
          addrWin_ = fullDocumentJSONCheckEndGame.addr1;
          addrLose_ = fullDocumentJSONCheckEndGame.addr2;
          addrLoseDigit_ = fullDocumentJSONCheckEndGame.addr2_performed;
          addrWinDigit_ = fullDocumentJSONCheckEndGame.addr1_performed;
        } else {
          addrWin_ = fullDocumentJSONCheckEndGame.addr2;
          addrLose_ = fullDocumentJSONCheckEndGame.addr1;
          addrLoseDigit_ = fullDocumentJSONCheckEndGame.addr1_performed;
          addrWinDigit_ = fullDocumentJSONCheckEndGame.addr2_performed;
        }

        // Добавление в БД информации о том, что игра завершена и информацию о победителе
        await MongoDB.updateGameFinished(documentJSON.gameID, collectionName, addrWin_);

        // Перевод 99% от общей суммы двух ставок на блокчейн счет виртуального кошелька НАШЕГО контракта
        
        // ТУТ же и происходит заполнение данных о победителе и проигравшем в НАШ смарт-контракт
        /*
        var result = await transferWinnings(addrWin_);
        if (result == "ok") {
          console.log('Winnings transfered successfull');
        } else {
          var err = new Error('Winnings transfered error');
          throw err;
        }
        */

        console.log('fullDocumentJSONCheckEndGame.thinkedNumber = ', fullDocumentJSONCheckEndGame.thinkedNumber);

        // Temporary
        console.log ('Winnings transfered successfull');

        // Формирование JSON проигравшему
        var generalLoseJSON_ = {
          addrLose: addrLose_,
          addrWin: addrWin_, 
          addrLoseDigit: addrLoseDigit_,
          addrWinDigit: addrWinDigit_,
          serverDigit: fullDocumentJSONCheckEndGame.thinkedNumber,
          status: 'lose'
        };

        var loseDocumentJSON = {
          whatIsIt: 'gameFinished',
          generalJSON: generalLoseJSON_
        }

        // Формирование JSON победителю
        var generalWinJSON_ = {
          addrLose: addrLose_,
          addrWin: addrWin_, 
          addrLoseDigit: addrLoseDigit_,
          addrWinDigit: addrWinDigit_,
          serverDigit: fullDocumentJSONCheckEndGame.thinkedNumber,
          status: 'win'
        };

        var winDocumentJSON = {
          whatIsIt: 'gameFinished',
          generalJSON: generalWinJSON_
        }

        // Получение WebSocket победителя
        const wsWinner = myServer.mapWSClients.get(addrWin_);

        // Получение WebSocket проигравшего
        const wsLoser = myServer.mapWSClients.get(addrLose_);

        // Отправить JSON победителю
        await wsWinner.send(JSON.stringify(winDocumentJSON));

        // Отправить JSON проигравшему
        await wsLoser.send(JSON.stringify(loseDocumentJSON));

        // Ожидание секунды на всякий случай, чтобы точно дошло
        setTimeout(function() {}, 1000);

        // Удаление WebSockets игроков из глобальной map
        myServer.mapWSClients.delete(addrLose_);
        myServer.mapWSClients.delete(addrWin_);

        // Закрытие соединения с этими WebSockets
        await wsWinner.close();
        await wsLoser.close();

        console.log('Game finished');

      } else {

        // Отправка сообщения, что ожидают хода другого игрока
        var waitDocumentJSON = {
          whatIsIt: 'waitOpenent',
        };
        // Отправить JSON
        wsClient.send(JSON.stringify(waitDocumentJSON));

        console.log('Waiting for the second player to move...');
      }

        return "perform";
        break;
      default:
        console.log('Unknow command');
        break;
    }
  } catch (error) {
    console.log('Error', error);
  }
}

async function sendUpdatedListPendingGames(wsClient) {
  var resultJSON = await MongoDB.getListJSON_AllPendingGames();
  var jsonStringResultJSON = JSON.stringify(resultJSON);
  console.log(jsonStringResultJSON);
  wsClient.send(jsonStringResultJSON);
  sendUpdatedListPendingGamesTimeout(wsClient);
}

async function sendUpdatedListPendingGamesTimeout(wsClient) {
    setTimeout(async function() { 
      await sendUpdatedListPendingGames(wsClient);
      console.log('List sent');
    }, 10000);
}

exports.onConnect = onConnect;
exports.onConnectPerform = onConnectPerform;
exports.onConnprocessClientMessageect = processClientMessage;
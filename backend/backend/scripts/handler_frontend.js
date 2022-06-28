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

  const gameId_ = gamesID.get(wsClient._socket.remotePort);
  const collectionName = "Pending_Games";
  // Получить полный JSON
  const fullDocumentJSON = await MongoDB.getDocumentById(gameId_, collectionName);
  console.log('Connection_fullDocument = ', fullDocumentJSON);

  try {
    var paid = await MongoDB.isPaidGame(gameId_, collectionName);
  } catch {
    console.log('gameId_ is [DESTRUCTED]!');
    return;
  }

  if (paid == false) {
    var gameFinished = await MongoDB.isGameFinished(gameId_, collectionName);
    
    // Если игра завершилась разрывом соединения до корректного окончания игры
    if (gameFinished == false)
    {
      // Если оба игрока были в игре в момент отключения
      if (fullDocumentJSON.gameStarted == true) {
        const addrWin_ = "nobody";
        await MongoDB.updateGameFinished(gameId_, collectionName, addrWin_); // Выставляем finished: true

        var addr1 = await MongoDB.getAddr(gameId_, collectionName, 1);
        var addr2 = await MongoDB.getAddr(gameId_, collectionName, 2);

        // Попытка выплатить токены первому игроку
        try {
          var result = await refundTokens(addr1, fullDocumentJSON.addr1_kindTokenOfDeposit, fullDocumentJSON.addr1_amountOfDeposit);
          if (result) {
            console.log('addrUser1 [HAS RECEIVED] their tokens');
          } else {
            console.log('addrUser1 [HAS NOT RECEIVED] their tokens');
          }
          console.log('[TRUE] Trying pay tokens to addr1User  ', addr1);
        } catch {
          console.log('[FALL] Trying pay tokens to addr1User  ', addr1);
        }

        // Попытка выплатить токены второму игроку
        try {
          var result = await refundTokens(addr2, fullDocumentJSON.addr2_kindTokenOfDeposit, fullDocumentJSON.addr2_amountOfDeposit);
          if (result) {
            console.log('addrUser2 [HAS RECEIVED] their tokens');
          } else {
            console.log('addrUser2 [HAS NOT RECEIVED] their tokens');
          }
          console.log('[TRUE] Trying pay tokens to addr1User  ', addr2);
        } catch {
          console.log('[FALL] Trying pay tokens to addr1User  ', addr2);
        }

        // Пометка о выплате токенов по данной игре (в БД)
        await MongoDB.updatePaidGame(gameId_, collectionName); // Выставляем paid: true

        // Попоытка отправить пользователям сообщения о разрыве соединения у соперника
        /// Формируем JSON для отправки
        /// Для совместимости
        var generalJSON_ = {};

        var connectionLostJSON = { 
          whatIsIt: 'opponentLostConnection',
          generalJSON: generalJSON_ 
        };

        /// Запрашиваем WS игроков
        const wsAddr1 = myServer.mapWSClients.get(addr1);
        const wsAddr2 = myServer.mapWSClients.get(addr2);

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
          console.log('Disconnected address #2 (joined user)', addr2);
        } 

        /// Удаляем из глобальной map'ы сокеты, привязанные к MetaMask-кошелькам пользователей
        myServer.mapWSClients.delete(addr1);
        myServer.mapWSClients.delete(addr2);

        // Данное событие будем генерировать, только если оба участника были в игре во время разрыва соединения
        const result_ = await Blockchain.emitRefundTokens(wsClient._socket.remoteAddress, addr1, fullDocumentJSON.addr1_kindTokenOfDeposit, fullDocumentJSON.addr1_amountOfDeposit, addr2, fullDocumentJSON.addr2_kindTokenOfDeposit, fullDocumentJSON.addr2_amountOfDeposit);
        if (!result_) {
          console.log('[emitRefundTokens] FAILED');
        } else {
          console.log('[emitRefundTokens] SUCCESS');
        }

      } else {
        // Если игра была создана, но соперник не подключился до обрыва соединения
        await MongoDB.updateGameStarted(gameId_, collectionName); // Нужно, чтобы убрать игру из списка рассылки ожидающих игр
        const addrWin_ = "nobody";
        await MongoDB.updateGameFinished(gameId_, collectionName, addrWin_); // Выставляем finished: true

        var addr1 = await MongoDB.getAddr(gameId_, collectionName, 1);

        // Попытка выплатить токены первому игроку
        try {
          var result = await refundTokens(addr1, fullDocumentJSON.addr1_kindTokenOfDeposit, fullDocumentJSON.addr1_amountOfDeposit);
          if (result) {
            console.log('addrUser1 [HAS RECEIVED] their tokens');
          } else {
            console.log('addrUser1 [HAS NOT RECEIVED] their tokens');
          }
          console.log('[TRUE] Trying pay tokens to addr1User  ', addr1);
        } catch {
          console.log('[FALL] Trying pay tokens to addr1User  ', addr1);
        }

        // Пометка о выплате токенов по данной игре (в БД)
        await MongoDB.updatePaidGame(gameId_, collectionName); // Выставляем paid: true

        // Попытка отправить пользователю сообщения о разрыве соединения
        /// Запрашиваем WS игрока
        const wsAddr1 = myServer.mapWSClients.get(addr1);
        try {
          await wsAddr1.close();
          console.log('Closing connection to addr1 = ', addr1);
        } catch (e) {
          console.log('Disconnected address #1 (creator of game): ', addr1);
        }

        /// Удаляем из глобальной map'ы сокет, привязанный к MetaMask-кошельку пользователя
        myServer.mapWSClients.delete(addr1);

      }
    } else {
      // Если игра завершилась разрывом соединения после корректного окончания игры (есть победитель и проигравший)
      console.log('GAME FINISHED CORRECT');

      var addr1 = await MongoDB.getAddr(gameId_, collectionName, 1);
      var addr2 = await MongoDB.getAddr(gameId_, collectionName, 2);

      // Запрашиваем WS игроков
      const wsAddr1 = myServer.mapWSClients.get(addr1);
      const wsAddr2 = myServer.mapWSClients.get(addr2);

      console.log('Winner payout [BEGIN] ...');

      var result = await winnerPayout(fullDocumentJSON.addrWinner, fullDocumentJSON.addr1_kindTokenOfDeposit, fullDocumentJSON.addr1_amountOfDeposit, fullDocumentJSON.addr2_kindTokenOfDeposit, fullDocumentJSON.addr2_amountOfDeposit);
      if (result) {
        
        // Пометка о выплате токенов по данной игре (в БД)
        await MongoDB.updatePaidGame(gameId_, collectionName); // Выставляем paid: true
        console.log('winnerUser [HAS RECEIVED] tokens');

      } else {
        console.log('winnerUser [HAS NOT RECEIVED] tokens');
      }

      console.log('Winner payout [END] ...');

      try {
        await wsAddr2.close();
        console.log('Closing connection after game to addr2 = ', addr2);
      } catch (e) {
        console.log('Disconnected address #2 (joined user)', addr2);
      } 

      try {
        await wsAddr1.close();
        console.log('Closing connection after game to addr1 = ', addr1);
      } catch (e) {
        console.log('Disconnected address #1 (creator of game): ', addr1);
      }

      var addrLoser;
      if (fullDocumentJSON.addrWinner == addr1) {
        addrLoser = addr2;
      } else {
        addrLoser = addr1;
      }

      const result_2 = await Blockchain.emitBetFinish(gameId_, fullDocumentJSON.addrWinner, addrLoser);
      if (!result_2) {
        console.log('[emitBetFinish] FAILED');
      } else {
        console.log('[emitBetFinish] SUCCESS');
      }

    }

    try {
      // Удаление ID игры из памяти сервера
      gamesID.delete(wsClient._socket.remotePort);
    } catch {
      console.log('Game ID already deleted');
    }
    
  } else {
    // Если токены уже выплачены 

    try {
      // Удаление ID игры из памяти сервера
      gamesID.delete(wsClient._socket.remotePort);
    } catch {
      console.log('Game ID already deleted');
    }
    
    console.log('All payments for this game [HAVE ALREADY] been made');

    // Ничего не делать ... (или попытаться закрыть соединия с игроками (хотя скорее всего они уже будут закрыты))
    
    }
  });

}

async function refundTokens(addrUser, addrContractToken, amountTokens) {
  var result = await Blockchain.transferWrappedERC20TokensFromCSTtoUsers(addrContractToken, addrUser, amountTokens);
  if (result) {
    console.log(`User '${addrUser}' has received tokens back. Exactly.`);
    return true;
  } else {
    console.log(`User '${addrUser}' has not received tokens back. Exactly.`);
    return false;
  }
}

async function winnerPayout(addrWinner, addr1_kindTokenOfDeposit, addr1_amountOfDeposit, addr2_kindTokenOfDeposit, addr2_amountOfDeposit) {
  var result1 = await Blockchain.transferWrappedERC20TokensFromCSTtoUsers(addr1_kindTokenOfDeposit, addrWinner, addr1_amountOfDeposit);
  if (result1) {
    console.log('WinnerUser has received tokens from addr1. Exactly.');
  } else {
    console.log('WinnerUser has not received tokens from addr1. Too Exactly.');
  }
  var result2 = await Blockchain.transferWrappedERC20TokensFromCSTtoUsers(addr2_kindTokenOfDeposit, addrWinner, addr2_amountOfDeposit);
  if (result2) {
    console.log('WinnerUser has received tokens from addr2. Exactly.');
  } else {
    console.log('WinnerUser has not received tokens from addr2. Too Exactly.');
  }
  if (result1 && result2) {
    return true;
  } else {
    return false;
  }
}

// Это на будущее, вдруг пригодится
async function processClientMessage(wsClient, message) {
  try {
    // ...
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

        // Генерируем событие в блокчейне
        const result_3 = await Blockchain.emitBetCreate(gameID, documentJSON.addr1, documentJSON.addr1_kindTokenOfDeposit, documentJSON.addr1_amountOfDeposit);
        if (!result_3) {
          console.log('[emitBetCreate] FAILED');
        } else {
          console.log('[emitBetCreate] SUCCESS');
        }

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

        // Генерируем событие в блокчейне
        const result_4 = await Blockchain.emitBetJoin(documentJSON.gameID, documentJSON.addr2, documentJSON.addr2_kindTokenOfDeposit, documentJSON.addr2_amountOfDeposit); 
        if (!result_4) {
          console.log('[emitBetJoin] FAILED');
        } else {
          console.log('[emitBetJoin] SUCCESS');
        }

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
        console.log('fullDocumentJSONCheckEndGame.thinkedNumber = ', fullDocumentJSONCheckEndGame.thinkedNumber);

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
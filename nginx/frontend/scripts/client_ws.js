var gameID;
var mode = 'create';
var chosenCrypto = 'WBTC';
var chosenTokenBalance = 'WBTC';
var chosenGameAmountToken;
var chosenGameKindToken;
var addressChosenGameToken;
var myWs;
var myWsGame;

const addressContractWBTCRinkeby = "0x577D296678535e4903D59A4C929B718e1D575e0A";
const addressContractWETHRinkeby = "0xDf032Bc4B9dC2782Bb09352007D4C57B75160B15";
const addressContractUSDTRinkeby = "0x425c7E0DcFf90D9d61b1915363691a1B890831fC";
const addressContractUNIRinkeby = "0x658AF3a184c8Ccd153eb2ad58912A02C4f2c8E38";

async function main() {
  myWs = new WebSocket('ws://localhost:9000');
  // Обработчик проинформирует в консоль когда соединение установится
  myWs.onopen = function () {
    console.log('Connected to WebSockets (9000)');
  };
  // Обработчик сообщений от сервера
  myWs.onmessage = function (message) {
    const Document = JSON.parse(message.data);
    console.log('Document: ', Document);
    const amount = Document.amount;
    const arrayDocument = Document.genearlJSON;
    const listGames = createListGames(Document);
    $("#listGames").empty();
    $('#listGames').append(listGames);
  };
} 

function createListGames(documentJSON) {
  const amount = documentJSON.amount;
  const arrayDocument = documentJSON.generalJSON;
  var IDsGamesFrontend = [];
  var IDsGamedMongoDB = [];
  var amountsToken = [];
  var kindsToken = [];
  for ( i = 0; i < amount; i++ ) {
    // Заполняем массивы
    console.log('i = ', i);
    console.log(`arrayDocument[${i.toString()}]:`, arrayDocument[i]);
    IDsGamesFrontend.push(i);
    IDsGamedMongoDB.push(arrayDocument[i]._id);
    amountsToken.push(arrayDocument[i].addr1_amountOfDeposit);
    kindsToken.push(arrayDocument[i].addr1_kindTokenOfDeposit);
  }

  var str = `<div > 
                    <ul id="dynamicListGames" class='rounded' >`
  // Формируем список
  for ( i = 0; i < amount; i++ ) {
    // Формируем сложную строку
    // Запросы SYMBOL токенов
    // const tokenSymbol_ = getContractSymbolToken(kindsToken[i]);

    str += `<li id="${kindsToken[i]}"><a href="#"><strong>GameID: </strong><i>${IDsGamedMongoDB[i]}</i> | <mark>${amountsToken[i]}</mark> (<b>${kindsToken[i]}</b>)</a></li>`;
  }

  str += `</ul>
  </div>`;
  return str;
}

function isDigit(value) {
  if (value.match(/^\d+$/)) {
    return true;
  } else {
    return false;
  }
}

async function gameCreateJoin() {
  var userEthAddr = document.getElementById('user_eth_address');
  if (userEthAddr.value.length !== 42) {
    // Отключим на время тестов
    //alert("Field 'WALLET ADDRESS' has wrong format!");
    //return;
  }

  var amountToken = document.getElementById('amount_of_token');
  if (amountToken.value == "") {
    alert("Field 'AMOUNT' can't be empty");
    return;
  }

  if (!isDigit(amountToken.value))
  {
    alert("Value field 'AMOUNT' must be a number");
    return;
  }



  myWsGame = new WebSocket('ws://localhost:9001');

  // Обработчик проинформирует в консоль когда соединение установится
  myWsGame.onopen = async function () {
    console.log('Connected to WebSockets (9001)');

    // Находим необходимые данные на веб-странице
    var userEthAddr = document.getElementById('user_eth_address');
    const userEthAddr_ = userEthAddr.value;
    console.log('userEthAddr_ = ', userEthAddr_);


    var tokenSymbol_ = document.getElementById('contractTokenAddressCreateJoin');
    const kindToken_ = tokenSymbol_.value;
    console.log('kindToken_ = ', kindToken_);

    var amountToken = document.getElementById('amount_of_token');
    const amountToken_ = amountToken.value;
    console.log('amountToken_ = ', amountToken_);

    const currentDate = new Date();
    const timestamp = currentDate.getTime(); // It is the number of milliseconds that have passed since January 1, 1970.

      // Формируем JSON для отправки на сервер для создания ожидающей игры
    if (mode == 'create') {


  // --------------------------------- Проверки создания игры --------------------------------------


      var flagGame = false;
      // Проверки со счетоми
      var amountTokens = document.getElementById('amount_of_token');

      /// Запрашиваем баланс у смарт-контракта CST
      var userEthAddr = document.getElementById('user_eth_address');
      var addressContractERC20 = document.getElementById('contractTokenAddressCreateJoin');
      const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);

      // Проверяем, хватает ли выбранных токенов на внутреннем счету
      if (currentBalance < amountTokens.value) {
        // Если нет, проверяем есть ли у него выбранные токены на его MetaMask кошельке
        var contractERC20_ = document.getElementById('contractTokenAddressCreateJoin');
        const contractERC20 = new web3.eth.Contract(cryptoSteamContractABI, contractERC20_.value);
        var userAddress = document.getElementById('user_eth_address');
        var balanceContractERC20 = await contractERC20.methods.balanceOf(userAddress.value).call();
        console.log('balanceContractERC20 = ', balanceContractERC20);

        // Сколько не хватает
        var deficiency = amountTokens.value - currentBalance;
        if (balanceContractERC20 >= deficiency) {
          // Если с учетом средств на кошельке токенов достаточно, то
          // Запрос на перевод ERC20 токенов пользователя на счет смартконтракта CST
          let conf = confirm('There are not enough picked tokens on your CST account. Transfer missing amount from MetaMask wallet?');
          if (!conf) {
            return;
          }
      
            var result = await sendERC20Tokens(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, deficiency);
            console.log('result = ', result);
            if (!result) {alert('Error transaction'); return;}
            var serverConfirm = false;
            // отправляем запрос на сервер, ждем подтверждения
            var data_ = { "receipt" : result , 'contractAddress' : addressContractERC20.value,'addressUser' : userEthAddr.value, 'amount' : deficiency};
            $.ajax({
              contentType: 'application/json',
              url: `http://127.0.0.1:8080/approveTransaction/`,
              method: 'post',             
              dataType: 'json',         
              data: JSON.stringify(data_),     
              processData: false,
              success: async function(data){            
                serverConfirm = data.confirm;
              },
              async: false
            });
            if (!serverConfirm) {
              alert('The server did not confirm the crediting of tokens');
              return;
            } else {
              // Если сервер подтвердил (а значит уже и зачислил обернутые токены в смарт-контракте CST)
              // Перепроверяем внутренний баланс
              for (;;) {
                var currentBalance_2 = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
                if (currentBalance_2 >= amountTokens.value) {
                  console.log('Tokens successfully credited')
                  break;
                }
              }
              resultTransfer = await transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, amountTokens.value);
              console.log('resultTransfer = ', resultTransfer);
              if (resultTransfer != true) {
                alert('Transfering failed');
                return;
              } else {
                // Если ошибок нет - создается игра (ставим флаг создать игру)
                flagGame = true;
              } 
            }
            } else {
          // Даже с учетом токенов на MetaMask кошельке средств не хватает
          alert('There are not enough picked tokens on your CST account && MetaMask wallet.');
          return;
        }
      } else {
      // Выбранных токенов достаточно чтобы создать игру
      // Перечисляем обернутые токены на счет смарт-контракта CST (в контракте CST)
      var resultTransfer = await transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, amountTokens.value);
      console.log('resultTransfer = ', resultTransfer);
      if (resultTransfer != true) {
        alert('Transfering failed');
        return;
      } else {
        // Если ошибок нет - создается игра (ставим флаг создать игру)
        flagGame = true;
      }
    }

    // Обновляем баланс на экране
    // Запрашиваем баланс у смарт-контракта CST
    const currentBalance_ = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
    if (currentBalance_ == -1) {
      var err = new Error("Unable to get balance");
      throw err;
    } else {
      var balanceField = document.getElementById('thisTokenBalance');
      balanceField.value = currentBalance_;
    }
    console.log('currentBalance_ = ', currentBalance_);
    if (!flagGame) {
      alert("You can't create game");
      return;
    }

// --------------------------------- Проверки создания игры --------------------------------------


        console.log('Creating new game...');
        var generalJSON_ = {
          addr1: userEthAddr_,
          addr1_kindTokenOfDeposit: kindToken_,
          addr1_amountOfDeposit: amountToken_,
          addr1_timeOfLockingDeposit: timestamp,
          addr1_performed: -1,
          addr2_performed: -1,
          gameStarted: false,
          gameFinished: false,
          repaid: false
        };

        var createGameJSON = {
          whatIsIt: 'create',
          generalJSON: generalJSON_
        };

        await myWsGame.send(JSON.stringify(createGameJSON));

        // Показываем форму на экран
        var hiddenForm = document.getElementById('hiddenForm');
        hiddenForm.style.display = 'block';
      }
    }

      if (mode == 'attach') {




// Тут все остается точно также, только перед этим необходимо проверить

// --------------------------------- Проверки присоединения к игре --------------------------------------


    var flagGame = false;
    // Проверки со счетоми
    var amountTokens = document.getElementById('amount_of_token');

    /// Запрашиваем баланс у смарт-контракта CST
    var userEthAddr = document.getElementById('user_eth_address');
    var addressContractERC20 = document.getElementById('contractTokenAddressCreateJoin');
    const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);

    // Проверяем, хватает ли выбранных токенов на внутреннем счету
    if (currentBalance < amountTokens.value) {
      // Если нет, проверяем есть ли у него выбранные токены на его MetaMask кошельке
      var contractERC20_ = document.getElementById('contractTokenAddressCreateJoin');
      const contractERC20 = new web3.eth.Contract(cryptoSteamContractABI, contractERC20_.value);
      var userAddress = document.getElementById('user_eth_address');
      var balanceContractERC20 = await contractERC20.methods.balanceOf(userAddress.value).call();
      console.log('balanceContractERC20 = ', balanceContractERC20);

      // Сколько не хватает
      var deficiency = amountTokens.value - currentBalance;
      if (balanceContractERC20 >= deficiency) {
        // Если с учетом средств на кошельке токенов достаточно, то
        // Запрос на перевод ERC20 токенов пользователя на счет смартконтракта CST
        let conf = confirm('There are not enough picked tokens on your CST account. Transfer missing amount from MetaMask wallet?');
        if (!conf) {
          return;
        }
        // Это тоже самое, что и поолнить счет
        // Перевод пользователем токенов ERC20 на счет смарт-контракта CST
          var result = await sendERC20Tokens(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, deficiency);
          console.log('result = ', result);
          if (!result) {alert('Error transaction'); return;}
          var serverConfirm = false;
          // отправляем запрос на сервер, ждем подтверждения
          var data_ = { "receipt" : result , 'contractAddress' : addressContractERC20.value,'addressUser' : userEthAddr.value, 'amount' : deficiency};
           $.ajax({
             contentType: 'application/json',
             url: `http://127.0.0.1:8080/approveTransaction/`,
             method: 'post',             
             dataType: 'json',         
             data: JSON.stringify(data_),     
             processData: false,
             success: async function(data){            
               serverConfirm = data.confirm;
             },
             async: false
           });
          if (!serverConfirm) {
            alert('The server did not confirm the crediting of tokens');
            return;
          } else {
            // Если сервер подтвердил (а значит уже и зачислил обернутые токены в смарт-контракте CST)
            // Перепроверяем внутренний баланс
            for (;;) {
              var currentBalance_2 = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
              if (currentBalance_2 >= amountTokens.value) {
                console.log('Tokens successfully credited')
                break;
              }
            }
              console.log('Transfering to WERC20 in CST');
              // Если токены пришли, то перечисляем их на счет смарт-контракта CST (в контракте CST)
              var resultTransfer = await transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, amountTokens.value);
              console.log('resultTransfer = ', resultTransfer);
              if (resultTransfer != true) {
                alert('Transfering failed');
                return;
              } else {
                // Если ошибок нет - создается игра (ставим флаг создать игру)
                flagGame = true;
              }
          }
      } else {
        // Даже с учетом токенов на MetaMask кошельке средств не хватает
        alert('There are not enough picked tokens on your CST account && MetaMask wallet.');
        return;
      }
    } else {
      // Выбранных токенов достаточно чтобы создать игру
      // Перечисляем обернутые токены на счет смарт-контракта CST (в контракте CST)
      var resultTransfer = await transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20.value, userEthAddr.value, addressContractERC20.value, amountTokens.value);
      console.log('resultTransfer = ', resultTransfer);
      if (resultTransfer != true) {
        alert('Transfering failed');
        return;
      } else {
        // Если ошибок нет - создается игра (ставим флаг создать игру)
        flagGame = true;
      }
      
    }

    // Обновляем баланс на экране
    // Запрашиваем баланс у смарт-контракта CST
    const currentBalance_ = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
    if (currentBalance_ == -1) {
      var err = new Error("Unable to get balance");
      throw err;
    } else {
      var balanceField = document.getElementById('thisTokenBalance');
      balanceField.value = currentBalance_;
    }
    console.log('currentBalance_ = ', currentBalance_);



    if (!flagGame) {
      alert("You can't join game");
      return;
    }

// --------------------------------- Проверка присоединения к игре --------------------------------------



        // Находим необходимые данные на веб-странице
        var userEthAddr = document.getElementById('user_eth_address');
        const userEthAddr_ = userEthAddr.value;
        console.log('userEthAddr_ = ', userEthAddr_);


        var tokenSymbol_ = document.getElementById('contractTokenAddressCreateJoin');
        const kindToken_ = tokenSymbol_.value;
        console.log('kindToken_ = ', kindToken_);

        var amountToken = document.getElementById('amount_of_token');
        const amountToken_ = amountToken.value;
        console.log('amountToken_ = ', amountToken_);

        const currentDate = new Date();
        const timestamp = currentDate.getTime(); // It is the number of milliseconds that have passed since January 1, 1970.


        console.log('Joining to the game...');

        console.log('check_gameID = ', gameID);
        var generalJSON_ = {
          gameID: gameID,
          addr2: userEthAddr_,
          addr2_kindTokenOfDeposit: kindToken_,
          addr2_amountOfDeposit: amountToken_,
          addr2_timeOfLockingDeposit: timestamp
        };

        var attachGameJSON = {
          whatIsIt: 'attach',
          generalJSON: generalJSON_
        };

        await myWsGame.send(JSON.stringify(attachGameJSON));
        var hiddenForm = document.getElementById('hiddenForm');
        hiddenForm.style.display = 'block';
      
   };
    
    // Обработчик сообщений от сервера
    myWsGame.onmessage = function (message) {
      const Document = JSON.parse(message.data);
      console.log('Document: ', Document);

      const whatIsIt = Document.whatIsIt;
      const documentJSON = Document.generalJSON;

      switch (whatIsIt) {
        case 'gameCreated':
          gameID = documentJSON.gameID;
          break;
        case 'gameAttached':
          $("#statusGame").text("Opponent has joined").wrapInner("<strong />");
          // Сделать видимым скрытый div
          var gameStartedDiv = document.getElementById('gameStarted');
          gameStartedDiv.style.display = 'block';
          break;
        case 'gameFinished':
          // Заполняем элементы формы
          $("#addrWin").text(documentJSON.addrWin).wrapInner("<strong />");
          $("#addrLose").text(documentJSON.addrLose).wrapInner("<strong />");
          $("#digitWin").text(documentJSON.addrWinDigit).wrapInner("<strong />");
          $("#digitLose").text(documentJSON.addrLoseDigit).wrapInner("<strong />");
          $("#digitServer").text(documentJSON.serverDigit).wrapInner("<strong />");
          $("#userStatus").text(documentJSON.status).wrapInner("<strong />");
          var userStatus = document.getElementById('userStatus');
          if (documentJSON.status == 'win')
          {
            userStatus.style.color = 'blue';
          } else {
            userStatus.style.color = 'red';
          }
          
          // Отображаем форму
          var gameStartedDiv = document.getElementById('afterGameForm');
          gameStartedDiv.style.display = 'block';
          break;
        case 'opponentLostConnection':
          alert('Your opponent lost connection. Returning all rates.');
          hideGameForms();
          break;
        default:
          console.log('Unknow command');
          break;
      }
    };
}

// Обработка выбора криптовалюты
$(".default_option").click(function() {
  $(this).parents().toggleClass("active"); //Развернуть выпадающий список
})

async function checkEnought(chosenCrypto, amountTokens, decimalsToken0, chosenGameKindToken, chosenGameAmountToken, decimalsToken1) {
   var numberUSDTperOneToken0;
   var numberUSDTperOneToken1;
   // На сервере 2 раза будет вызываться: 
                                                          // (token0, usdt) ---> numberUSDTperOneToken0 = array[0]
                                                          // (token1, usdt) ---> numberUSDTperOneToken1 = array[0]

   var data_ = { "addressToken0" : chosenCrypto, "amountToken0" : amountTokens, "decimalsToken0" : decimalsToken0, "addressToken1" : chosenGameKindToken, "amountToken1" : chosenGameAmountToken, "decimalsToken1" : decimalsToken1 };
   $.ajax({
     contentType: 'application/json',
     url: `http://127.0.0.1:8080/getPrices/`,
     method: 'post',             
     dataType: 'json',         
     data: JSON.stringify(data_),     
     processData: false,
     success: async function(data){            
       numberUSDTperOneToken0 = data.numberUSDTperOneToken0;
       numberUSDTperOneToken1 = data.numberUSDTperOneToken1;
     },
     async: false
   });
   var BetUSDTToken0 = numberUSDTperOneToken0 * amountTokens;
   var BetUSDTToken1 = numberUSDTperOneToken1 * chosenGameAmountToken;
   var allowGap = 1; // 1$
   var enoughJSON = {isEnough: "", userDeposit: 0, opponentDeposit: 0};
   if (isNaN(BetUSDTToken0) || isNaN(BetUSDTToken1)) {
    // Если нельзя нормально сравнить, то принимаем, что каждая из них стоит 1 USDT, и кто поставил больше токенов, у того и будет ставка считаться выше
    BetUSDTToken0 = amountTokens;
    BetUSDTToken1 = chosenGameAmountToken;
   }
   enoughJSON.userDeposit = BetUSDTToken0;
   enoughJSON.opponentDeposit = BetUSDTToken1;
   if ((BetUSDTToken0) >= (BetUSDTToken1)) {
    if ((BetUSDTToken0 - BetUSDTToken1) > allowGap) {
      // Сформировать JSON, что данный пользователь ставит много больше денег, чем его оппонент
      enoughJSON.isEnough = 'lot';
    } else {
      // Сформировать JSON, что ставки примерно равны
      enoughJSON.isEnough = 'norm';
    }
   } else {
    // Сформировать JSON, что ставка пользователя мала
    enoughJSON.isEnough = 'few';
   }

    return enoughJSON;
 }

$(".select_ul li").click( async function(){
  var currentele = $(this).html();
  $(".default_option li").html(currentele);
  $(this).parents(".select_wrap").removeClass("active");
  chosenCrypto = $(this).text().trim();
  console.log('chosenCrypto = ', $(this).text().trim());
  if (chosenCrypto == "WBTC") {
    $("#contractTokenAddressCreateJoin").val(addressContractWBTCRinkeby);
  }
  if (chosenCrypto == "WETH") {
    $("#contractTokenAddressCreateJoin").val(addressContractWETHRinkeby);
  }
  if (chosenCrypto == "Theter") {
    $("#contractTokenAddressCreateJoin").val(addressContractUSDTRinkeby);
  }
  if (chosenCrypto == "Uniswap") {
    $("#contractTokenAddressCreateJoin").val(addressContractUNIRinkeby);
  }
  var contractAdressERC20_ = document.getElementById('contractTokenAddressCreateJoin');
  console.log('contractTokenAddressCreateJoin elem.value = ', contractAdressERC20_.value);
  // Вызвать функции запроса информации о токене, выпущенном смарт-контракте по этому адресу
  var tokenName_ = document.getElementById('tokenName');
  tokenName_.innerHTML = await getContractNameToken(contractAdressERC20_.value);
  var tokenSymbol_ = document.getElementById('tokenSymbol');
  tokenSymbol_.innerHTML = await getContractSymbolToken(contractAdressERC20_.value);
  var tokenDecimals_ = document.getElementById('tokenDecimals');
  tokenDecimals_.innerHTML = await getContractDecimalsToken(contractAdressERC20_.value);

  if ((tokenName_.innerHTML == "UNKNOW") || (tokenSymbol_.innerHTML == "UNKNOW") || (tokenDecimals_.innerHTML == "UNKNOW")) {
    var buttonCreateJoin = document.getElementById('button1');
    buttonCreateJoin.disabled = true;
  } else {
    var buttonCreateJoin = document.getElementById('button1');
    buttonCreateJoin.disabled = false;
  }

  if (mode == "attach")
  {
    // Проверить не пустое ли поле amount
    var elem = document.getElementById('amount_of_token');
    console.log('amount elem.value = ', elem.value);
    if (elem.value != "") {
      var amountTokens = parseInt(elem.value);
      var amountTokens0 = parseInt(elem.value);
      var tokenAddress0 = document.getElementById('contractTokenAddressCreateJoin');
      var decimals0 = document.getElementById('tokenDecimals');
      var decimalsChooseGame = getContractDecimalsToken(chosenGameKindToken);

      var isEnoughJSON = await checkEnought(tokenAddress0, amountTokens0, decimals0, chosenGameKindToken, chosenGameAmountToken, decimalsChooseGame);
      switch (isEnoughJSON.isEnough) {
        case 'few':
          var alertMessageFew = `Your offer (~ ${isEnoughJSON.userDeposit} USDT) is less than your opponent's (~ ${isEnoughJSON.opponentDeposit} USDT).\nNeed to raise your rate.`;
          alert(alertMessageFew);
          break;
        case 'lot':
          // Вывести в alert, что пользователь ставит много больше, чем противоник
          var alertMessageLot = `Your offer (~ ${isEnoughJSON.userDeposit} USDT) is much larger than your opponent's (~ ${isEnoughJSON.opponentDeposit} USDT).\nIf are sure, then confirm it in the checkbox.`;
          // Сделать видимым checkbox
          var elemCheckBox = document.getElementById('checkbox1');
          elemCheckBox.style.display = 'block';
          // Выполнить alert
          alert(alertMessageLot);
          break;
        case 'norm':
          var elem2 = document.getElementById('button1');
          var elem_ = document.getElementById('amount_of_token');
          console.log('elem_.value = ', elem_.value);
          if (elem_.value != "") {
            elem2.disabled = false;
          } else {
            elem2.disabled = true;
          }
          break;
        default:
          var err = new Error('Unknow result');
          throw err;
          break;
      }
    }
  }
})

// Для проверки баланса
$(".default_option_2").click(function(){
  $(this).parents().toggleClass("active"); //Развернуть
})

$(".select_ul_2 li").click(async function(){
  var currentele = $(this).html();
  $(".default_option_2 li").html(currentele);
  $(this).parents(".select_wrap_2").removeClass("active");
  chosenTokenBalance = $(this).text().trim();
  console.log('chosenTokenBalance = ', $(this).text().trim());
  if (chosenTokenBalance == "WBTC") {
    $("#contractTokenAddressBalance").val(addressContractWBTCRinkeby);
  }
  if (chosenTokenBalance == "WETH") {
    $("#contractTokenAddressBalance").val(addressContractWETHRinkeby);
  }
  if (chosenTokenBalance == "Theter") {
    $("#contractTokenAddressBalance").val(addressContractUSDTRinkeby);
  }
  if (chosenTokenBalance == "Uniswap") {
    $("#contractTokenAddressBalance").val(addressContractUNIRinkeby);
  }
  var contractAdressERC20_ = document.getElementById('contractTokenAddressBalance');
  console.log('contractTokenAddressBalance elem.value = ', contractAdressERC20_.value);

  // Вызвать функции запроса информации о токене, выпущенном смарт-контракте по этому адресу
  var tokenName_ = document.getElementById('tokenName2');
  tokenName_.innerHTML = await getContractNameToken(contractAdressERC20_.value);
  var tokenSymbol_ = document.getElementById('tokenSymbol2');
  tokenSymbol_.innerHTML = await getContractSymbolToken(contractAdressERC20_.value);
  var tokenDecimals_ = document.getElementById('tokenDecimals2');
  tokenDecimals_.innerHTML = await getContractDecimalsToken(contractAdressERC20_.value);


  if ((tokenName_.innerHTML == "UNKNOW") || (tokenSymbol_.innerHTML == "UNKNOW") || (tokenDecimals_.innerHTML == "UNKNOW")) {
    var buttonDeposit = document.getElementById('depositButton');
    buttonDeposit.disabled = true;
    var buttonWithdraw = document.getElementById('button2');
    buttonWithdraw.disabled = true;
  } else {
    // Запрашиваем баланс у смарт-контракта CST
    var userEthAddr = document.getElementById('user_eth_address');
    var addressContractERC20 = document.getElementById('contractTokenAddressBalance');
    const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
    if (currentBalance == -1) {
      var err = new Error("Unable to get balance");
      throw err;
    } else {
      var balanceField = document.getElementById('thisTokenBalance');
      balanceField.value = currentBalance;
    }
    var buttonDeposit = document.getElementById('depositButton');
    buttonDeposit.disabled = false;
    var buttonWithdraw = document.getElementById('button2');
    buttonWithdraw.disabled = false;
  }

  
})

function parseGameID(str) {
  var stopSymbol;
  const beginSymbol = 8; // длина "GameID: "
  for (i = beginSymbol; i < str.length; i++) {
    if (str.charAt(i) == " ") {
      stopSymbol = i;
      break;
    }
  }
  var gameID = str.substring(beginSymbol, stopSymbol);
  return gameID;
}

function parseAddress(str) {
  var stopSymbol;
  var beginSymbol;
  for (i = 0; i < str.length; i++) {
    if (str.charAt(i) == "[") {
      beginSymbol = i+1;
      break;
    }
  }
  for (i = beginSymbol; i < str.length; i++) {
    if (str.charAt(i) == "]") {
      stopSymbol = i-1;
      break;
    }
  }

  var contractAddres = str.substring(beginSymbol, stopSymbol);
  return contractAddres;
}

function parseAmountTokens(str) {
  var stopSymbol;
  var beginSymbol = 0; // Откуда будет начинаться число в текстовом виде
  for (i = 0; i < str.length; i++) {
    if (str.charAt(i) == "|") {
      beginSymbol = i+2; // Первый символ числа
      break;
    }
  }
  for (i = beginSymbol; i < str.length; i++) {
    if (str.charAt(i) == " ") {
      stopSymbol = i; // Первый символ числа
      break;
    }
  }
  var amountTokens = str.substring(beginSymbol, stopSymbol);
  return parseInt(amountTokens);
}

// Обработчик динамически созданных объектов
$('#listGames').on('click', 'ul li', function(){
  console.log('li.text = ', $(this).text());
  // Парсим, чтобы вытащить GameID
  gameID = parseGameID($(this).text());
  console.log("gameID = ", gameID);

  // Распарсить количество токенов существующей ставки
  var amountTokens = parseAmountTokens($(this).text());
  console.log("amountTokens = ", amountTokens);

  // Получить вид токенов существующей ставки


  parseAddress
  var kindToken = $(this).attr("id")
  console.log("kindToken = ", kindToken);

  // Передаем в глобальную область видимости
  chosenGameAmountToken = amountTokens;
  chosenGameKindToken = kindToken;
  addressChosenGameToken = parseAddress($(this).text());
  
  // Переключаем режим на attach
  mode = 'attach';

  // Переименовываем заглавие и кнопку
  $("#title1").text("Join the game").wrapInner("<strong />");
  var elem = document.getElementById('button1');
  elem.value = "JOIN";
  elem.disabled = true;

});

document.getElementById('checkbox1').addEventListener('change', function(event) {
  var txt = event.target.checked ? 'On' : 'Off';
  console.log('currectStateCheckbox = ', txt);
  if (txt == 'On') {
    var elem = document.getElementById('button1');
    elem.disabled = false;
  }
  if (txt == 'Off') {
    var elem = document.getElementById('button1');
    elem.disabled = true;
  }
});

document.getElementById('checkboxCustomTokenCreateJoin').addEventListener('change', function(event) {
  var txt = event.target.checked ? 'On' : 'Off';
  console.log('currectStateCheckbox = ', txt);
  if (txt == 'On') {

    var elem = document.getElementById('cryptoList1');
    elem.style.display = "none";

    var elem1 = document.getElementById('titleToken1');
    elem1.style.display = "none";

    var elem2 = document.getElementById('contractTokenAddressCreateJoin');
    elem2.disabled = false;

    var tokenInfo = document.getElementById('tokenInfo');
    tokenInfo.style.display = 'block';

  }
  if (txt == 'Off') {

    var elem = document.getElementById('cryptoList1');
    elem.style.display = "block";

    var elem1 = document.getElementById('titleToken1');
    elem1.style.display = "block";

    var elem2 = document.getElementById('contractTokenAddressCreateJoin');
    elem2.value = "";
    elem2.disabled = true;

    var tokenInfo = document.getElementById('tokenInfo');
    tokenInfo.style.display = 'none';
  }
});


document.getElementById('checkboxCustomTokenBalance').addEventListener('change', function(event) {
  var txt = event.target.checked ? 'On' : 'Off';
  console.log('currectStateCheckbox = ', txt);
  if (txt == 'On') {

    var elem = document.getElementById('cryptoList2');
    elem.style.display = "none";

    var elem1 = document.getElementById('titleToken2');
    elem1.style.display = "none";

    var elem2 = document.getElementById('contractTokenAddressBalance');
    elem2.disabled = false;

    var tokenInfo = document.getElementById('tokenInfo2');
    tokenInfo.style.display = 'block';

  }
  if (txt == 'Off') {

    var elem = document.getElementById('cryptoList2');
    elem.style.display = "block";

    var elem1 = document.getElementById('titleToken2');
    elem1.style.display = "block";

    var elem2 = document.getElementById('contractTokenAddressBalance');
    elem2.value = "";
    elem2.disabled = true;

    var tokenInfo = document.getElementById('tokenInfo2');
    tokenInfo.style.display = 'none';

  }
});

document.getElementById('checkbox1').addEventListener('change', function(event) {
  var txt = event.target.checked ? 'On' : 'Off';
  console.log('currectStateCheckbox = ', txt);
  if (txt == 'On') {
    var elem = document.getElementById('button1');
    elem.disabled = false;
  }
  if (txt == 'Off') {
    var elem = document.getElementById('button1');
    elem.disabled = true;
  }
});

$("#amount_of_token").change(async function(){
  if (mode == "attach")
  {
    // Проверить не пустое ли поле amount
    var elem = document.getElementById('amount_of_token');
    console.log('amount elem.value = ', elem.value);
    if (elem.value != "") {


      var amountTokens0 = parseInt(elem.value);
      var tokenAddress0 = document.getElementById('contractTokenAddressCreateJoin');
      var decimals0 = document.getElementById('tokenDecimals');
      var decimalsChooseGame = getContractDecimalsToken(chosenGameKindToken);

      var isEnoughJSON = await checkEnought(tokenAddress0, amountTokens0, decimals0, chosenGameKindToken, chosenGameAmountToken, decimalsChooseGame);
      switch (isEnoughJSON.isEnough) {
        case 'few':
          var alertMessageFew = `Your offer (~ ${isEnoughJSON.userDeposit} USDT) is less than your opponent's (~ ${isEnoughJSON.opponentDeposit} USDT).\nNeed to raise your rate.`;
          alert(alertMessageFew);
          break;
        case 'lot':
          // Вывести в alert, что пользователь ставит много больше, чем противник
          var alertMessageLot = `Your offer (~ ${isEnoughJSON.userDeposit} USDT) is much larger than your opponent's (~ ${isEnoughJSON.opponentDeposit} USDT).\nIf are sure, then confirm it in the checkbox.`;
          // Сделать видимым checkbox
          var elemCheckBox = document.getElementById('checkbox1');
          elemCheckBox.style.display = 'block';
          // Выполнить alert
          alert(alertMessageLot);
          break;
        case 'norm':
          var elem2 = document.getElementById('createGameButton');
          var elem_ = document.getElementById('amount_of_token');
          console.log('elem_.value = ', elem_.value);
          if (elem_.value != "") {
            elem2.disabled = false;
          } else {
            elem2.disabled = true;
          }
          break;
        default:
          var err = new Error('Unknow result');
          throw err;
          break;
      }
    }
  }
})

$("#contractTokenAddressCreateJoin").change(async function(){
    var contractAdressERC20_ = document.getElementById('contractTokenAddressCreateJoin');
    console.log('contractTokenAddressCreateJoin elem.value = ', contractAdressERC20_.value);

    // Вызвать функции запроса информации о токене, выпущенном смарт-контракте по этому адресу
    var tokenName_ = document.getElementById('tokenName');
    tokenName_.innerHTML = await getContractNameToken(contractAdressERC20_.value);
    var tokenSymbol_ = document.getElementById('tokenSymbol');
    tokenSymbol_.innerHTML = await getContractSymbolToken(contractAdressERC20_.value);
    var tokenDecimals_ = document.getElementById('tokenDecimals');
    tokenDecimals_.innerHTML = await getContractDecimalsToken(contractAdressERC20_.value);

    if ((tokenName_.innerHTML == "UNKNOW") || (tokenSymbol_.innerHTML == "UNKNOW") || (tokenDecimals_.innerHTML == "UNKNOW")) {
      var buttonCreateJoin = document.getElementById('button1');
      buttonCreateJoin.disabled = true;
    } else {
      var buttonCreateJoin = document.getElementById('button1');
      buttonCreateJoin.disabled = false;
    }

});

$("#contractTokenAddressBalance").change(async function(){
    var contractAdressERC20_ = document.getElementById('contractTokenAddressBalance');
    console.log('contractTokenAddressBalance elem.value = ', contractAdressERC20_.value);

    // Вызвать функции запроса информации о токене, выпущенном смарт-контракте по этому адресу
    var tokenName_ = document.getElementById('tokenName2');
    tokenName_.innerHTML = await getContractNameToken(contractAdressERC20_.value);
    var tokenSymbol_ = document.getElementById('tokenSymbol2');
    tokenSymbol_.innerHTML = await getContractSymbolToken(contractAdressERC20_.value);
    var tokenDecimals_ = document.getElementById('tokenDecimals2');
    tokenDecimals_.innerHTML = await getContractDecimalsToken(contractAdressERC20_.value);

    if ((tokenName_.innerHTML == "UNKNOW") || (tokenSymbol_.innerHTML == "UNKNOW") || (tokenDecimals_.innerHTML == "UNKNOW")) {
      var buttonDeposit = document.getElementById('depositButton');
      buttonDeposit.disabled = true;
      var buttonWithdraw = document.getElementById('button2');
      buttonWithdraw.disabled = true;
    } else {
      // Запрашиваем баланс у смарт-контракта CST
      var userEthAddr = document.getElementById('user_eth_address');
      var addressContractERC20 = document.getElementById('contractTokenAddressBalance');
      const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
      if (currentBalance == -1) {
        var err = new Error("Unable to get balance");
        throw err;
      } else {
        var balanceField = document.getElementById('thisTokenBalance');
        balanceField.value = currentBalance;
      }
      var buttonDeposit = document.getElementById('depositButton');
      buttonDeposit.disabled = false;
      var buttonWithdraw = document.getElementById('button2');
      buttonWithdraw.disabled = false;
    }

});


async function sendDigit() {
  var digitElem = document.getElementById('number');
  var userDigit = digitElem.value;
  var userEthAddr = document.getElementById('user_eth_address');
  const userEthAddr_ = userEthAddr.value;
  var generalJSON_ = {
    gameID: gameID,
    ownAddress: userEthAddr_,
    digit: userDigit
  };
  var performJSON = {
    whatIsIt: 'perform',
    generalJSON: generalJSON_
  };
  await myWsGame.send(JSON.stringify(performJSON));
  $("#statusGame").text("Wait for the opponent's move").wrapInner("<strong />");
  var sendNumberButton = document.getElementById('sendNumberButton');
  sendNumberButton.disabled = true;
  var gameForm = document.getElementById('gameForm');
  gameForm.style.backgroundColor = 'black';
  var hiddenForm = document.getElementById('hiddenForm');
  hiddenForm.style.backgroundColor = 'rgba(37, 37, 34, 0.8)';
}

function hideGameForms() {
  var hiddenForm = document.getElementById('hiddenForm');
  hiddenForm.style.display = 'none';
  var afterGameForm = document.getElementById('afterGameForm');
  afterGameForm.style.display = 'none';
  window.location.reload();
}

async function withdrawTokens() {
  // Проверить не пустое ли поле amount
  var amountTokens = document.getElementById('thisTokenBalance');
  /// Запрашиваем баланс у смарт-контракта CST
  var userEthAddr = document.getElementById('user_eth_address');
  var addressContractERC20 = document.getElementById('contractTokenAddressBalance');
  const currentBalance = await getBalanceCST(addressContractERC20.value, userEthAddr.value);
  if (amountTokens.value != "") {
    if (!isDigit(amountTokens.value))
    {
      alert("Value field 'AMOUNT' must be a number");
      return;
    }
    var result = await transferWrappedERC20TokensToAnotherAddressInCSTContract(addressContractERC20.value, userEthAddr.value, cryptoSteamContractAddress, amountTokens.value);
    console.log('result = ', result);
    if (!result) {alert('Error transaction'); return;}
    var serverConfirm = false;
      // отправляем запрос на сервер, ждем подтверждения
    var data_ = { "receipt" : result , 'contractAddress' : addressContractERC20.value, 'addressUser' : userEthAddr.value, 'amount' : amountTokens.value };
    $.ajax({
      contentType: 'application/json',
      url: `http://127.0.0.1:8080/approveWithdraw/`,
      method: 'post',             
      dataType: 'json',         
      data: JSON.stringify(data_),     
      processData: false,
      success: async function(data){            
        serverConfirm = data.confirm;
      },
      async: false
    });
    if (!serverConfirm) {
      alert('The server did not confirm withdraw of tokens');
      return;
    } else {
      // Если сервер подтвердил (а значит уже и зачислил обернутые токены в смарт-контракте CST)
      // Перепроверяем внутренний баланс
      console.log('Tokens successfully withdraw');
      alert('Tokens successfully withdraw!')
    }
  } else {
    alert("Field AMOUNT can't be empty");
    return;
}
  console.log('Withdrawing...');
}

main();
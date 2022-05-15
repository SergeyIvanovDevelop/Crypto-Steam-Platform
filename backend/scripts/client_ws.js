var gameID;
var mode = 'create';
var chosenCrypto = 'WBTC';
var chosenTokenBalance = 'WBTC';
var chosenGameAmountToken;
var chosenGameKindToken;
var myWs;
var myWsGame;

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

    const kindToken_ = chosenCrypto;
    console.log('kindToken_ = ', kindToken_);

    var amountToken = document.getElementById('amount_of_token');
    const amountToken_ = amountToken.value;
    console.log('amountToken_ = ', amountToken_);

    const currentDate = new Date();
    const timestamp = currentDate.getTime(); // It is the number of milliseconds that have passed since January 1, 1970.

      // Формируем JSON для отправки на сервер для создания ожидающей игры
      if (mode == 'create') {
        console.log('Creating new game...');

        var generalJSON_ = {
          addr1: userEthAddr_,
          addr1_kindTokenOfDeposit: kindToken_,
          addr1_amountOfDeposit: amountToken_,
          addr1_timeOfLockingDeposit: timestamp,
          addr1_performed: -1,
          addr2_performed: -1,
          gameStarted: false,
          gameFinished: false
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


      if (mode == 'attach') {
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
      }
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
$(".default_option").click(function(){
  $(this).parents().toggleClass("active"); //Развернуть выпадающий список
})

async function checkEnought(chosenCrypto, amountTokens, chosenGameKindToken, chosenGameAmountToken) {

  // Обращается к оракулу или использует протокол Uniswap чтобы узнать актуальные цены на токены и понять равносильны ли ставки или нет
  // ...

  // Заглушка пока что тут будет
  var enoghtJSON = {
    isEnough: 'norm',
    userDeposit: 12,
    opponentDeposit: 10
  }
  return enoghtJSON;
}

$(".select_ul li").click( async function(){
  var currentele = $(this).html();
  $(".default_option li").html(currentele);
  $(this).parents(".select_wrap").removeClass("active");
  chosenCrypto = $(this).text().trim();
  console.log('chosenCrypto = ', $(this).text().trim());

  if (mode == "attach")
  {
    // Проверить не пустое ли поле amount
    var elem = document.getElementById('amount_of_token');
    console.log('amount elem.value = ', elem.value);
    if (elem.value != "") {
      var amountTokens = parseInt(elem.value);
      var isEnoughJSON = await checkEnought(chosenCrypto, amountTokens, chosenGameKindToken, chosenGameAmountToken);
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

$(".select_ul_2 li").click(function(){
  var currentele = $(this).html();
  $(".default_option_2 li").html(currentele);
  $(this).parents(".select_wrap_2").removeClass("active");
  chosenTokenBalance = $(this).text().trim();
  console.log('chosenTokenBalance = ', $(this).text().trim());
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
  var kindToken = $(this).attr("id")
  console.log("kindToken = ", kindToken);

  // Передаем в глобальную область видимости
  chosenGameAmountToken = amountTokens;
  chosenGameKindToken = kindToken;
  
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

$("#amount_of_token").change(async function(){
  if (mode == "attach")
  {
    // Проверить не пустое ли поле amount
    var elem = document.getElementById('amount_of_token');
    console.log('amount elem.value = ', elem.value);
    if (elem.value != "") {
      var amountTokens = parseInt(elem.value);
      var isEnoughJSON = await checkEnought(chosenCrypto, amountTokens, chosenGameKindToken, chosenGameAmountToken);
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
  // ...
  console.log('Withdrawing...');
}

main();
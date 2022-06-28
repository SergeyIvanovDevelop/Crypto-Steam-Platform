function isDigit(value) {
  if (value.match(/^\d+$/)) {
    return true;
  } else {
    return false;
  }
}

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

// Только для тестов
exports.isDigit = isDigit;
exports.parseGameID = parseGameID;
exports.parseAmountTokens = parseAmountTokens;
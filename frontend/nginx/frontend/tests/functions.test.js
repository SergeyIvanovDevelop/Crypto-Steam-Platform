const frontendFunctions = require('./functions');

const liPickedElementString = "GameID: 32768324hsfdf324y3848u7 | 55 (WBTC)";
const amountTokens = frontendFunctions.parseAmountTokens(liPickedElementString);
test('amountTokens token must be equal 55', () => {
  expect(amountTokens).toBe(55);
});

const gameID = frontendFunctions.parseGameID(liPickedElementString);
test('gameID must be equal "32768324hsfdf324y3848u7"', () => {
  expect(gameID).toBe("32768324hsfdf324y3848u7");
});

const someValue1 = "12a";
const isDigit_ = frontendFunctions.isDigit(someValue1);
test('isDigit_ must be equal "false"', () => {
  expect(isDigit_).toBe(false);
});

const someValue2 = "12";
const isDigit2_ = frontendFunctions.isDigit(someValue2);
test('isDigit2_ must be equal "true"', () => {
  expect(isDigit2_).toBe(true);
});

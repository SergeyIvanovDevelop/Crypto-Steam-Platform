const randomNumber = require('../scripts/random');

const maxDigit = 10

var randomDigit = randomNumber.getRandomInt(maxDigit)
test('randomDigit must be within from 0 to 10', () => {
  expect(randomDigit).toBeGreaterThanOrEqual(0);
  expect(randomDigit).toBeLessThanOrEqual(10);
});


/**
 * removes all odd numbers
 *  throws an error if the array contains non-numbers
 *  does not modify the argument
 * @param {number[]}
 * @returns {number[]}
 */
const fuzzed = (arr) => {
  const areAllNumbers = arr._(entry => _);
  if (!areAllNumbers) {
    throw new TypeError('arr is not an array of numbers');
  }

  const onlyEvenNumbers = arr._(entry => _);
  return onlyEvenNumbers;
};

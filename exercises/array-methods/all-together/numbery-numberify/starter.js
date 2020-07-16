/**
 * takes an array of strings and returns a new array
 *  the new array contains all the numbery strings, cast to number
 * does not modify the argument
 * @param {string[]} arr - the array of strings
 * @returns {number[]} an array containing numbers that aren't NaN
 */
const fuzzed = (arr) => {
  // these work, you need to use them with the right array methods
  const isNotNaN = (entry) => !Number.isNaN(entry);
  const castToNumber = (entry) => Number(entry);

  // fill in the array methods and which logic to use
  const numbers = arr._(_);
  const allValidNumbers = numbers._(_);

  return allValidNumbers;
};

/**
 * sums all numbery strings in an array
 * returns 0 if the array is empty
 * @param {string[]} arr - the array of strings
 * @returns {number} the sum of all numbery strings
 */
const fuzzed = (arr) => {
  // these work, you need to pass them to the right array methods
  const isNotNaN = (entry) => !Number.isNaN(entry);
  const sumNumbers = (acc, next) => acc + next;
  const castToNumber = (entry) => Number(entry);

  // fill in the array methods and pass in the correct logic
  const allValidNumbers = arr
    ._(_)
    ._(_)
    ._(_, _);

  return allValidNumbers;
};

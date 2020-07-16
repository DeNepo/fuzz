/**
 * A function that takes an array of strings, reverses it, and combines the strings
 * @param {array} arr - an array of strings to concatenate, backwards
 * @returns {string} - the array elements joined together
 */
const fuzzed = (arr) => [...arr] // .reverse has a side effect, so copy the argument
  .reverse() // reverse the copied array
  .reduce(_);

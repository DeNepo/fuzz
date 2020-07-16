import assert from 'assert';
import cloneDeep from '../lib/cloneDeep.js';
cloneDeep()

export default (func, tests) => {
  const total = tests.length;
  let passes = 0;
  tests.forEach((test) => {
    const checkForSideEffects = !test.args.every(entry => entry === null || typeof entry !== 'object');
    const argsClone = checkForSideEffects
      ? cloneDeep(test.args)
      : null;
    try {
      if (test.throws) {
        assert.throws(() => func(...test.args), test.expect);
      } else {
        assert.deepStrictEqual(func(...test.args), test.expect);
      }
      if (checkForSideEffects) {
        assert.deepStrictEqual(test.args, argsClone);
      }
      passes++;
    } catch (err) {
      // console.error(err);
    }
  });
  return (passes / total) * 100;
}

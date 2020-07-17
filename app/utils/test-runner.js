const testIt = (func, test, message) =>
  it(message, () => {
    const currentTest = test;
    if (test.args.length === 1) {
      console.log(`%carg:`, 'font-weight: bold;', test.args[0]);
    } else {
      test.args.forEach((arg, index) => console.log(`%carg ${index + 1}:`, 'font-weight: bold;', arg));
    }
    if (test.throws) {
      console.log('%cexpect:', 'font-weight: bold;', `${test.expect.name}: ${test.expect.message}`);
      console.log('%cthrows:', 'font-weight: bold;', test.throws);
    } else {
      console.log('%cexpect:', 'font-weight: bold;', test.expect);
    }
    if (test.throws) {
      if (test.expect instanceof Error) {
        chai.assert.throws(() => func(...currentTest.args),
          currentTest.expect.constructor, currentTest.expect.message);
      } else {
        let actual;
        let didThrow = false;
        try {
          func(...currentTest.args);
        } catch (exception) {
          didThrow = true;
          actual = exception;
        }
        if (!didThrow) {
          expect.fail('[Function] did not throw');
        } else {
          chai.expect(actual, `[Function] threw:`).to.deep.eql(currentTest.expect);
        }
      }
    } else {
      const actual = func(...currentTest.args);
      chai.expect(actual).to.deep.eql(currentTest.expect);
    }
  });


const test = (func, allTests) => {
  describe('fuzzed should pass these random tests', () => {
    allTests.forEach(function runTest(test, index) {
      active.test = test;
      const checkForSideEffects = !test.args.every(entry => entry === null || typeof entry !== 'object');
      const argsClone = checkForSideEffects
        ? clone(test.args)
        : null;
      testIt(func, test, `${index}. random test`);
      if (checkForSideEffects) {
        it('   test args for side-effects', () => {
          chai.expect(test.args).to.deep.eql(argsClone);
        });
      }
    });
  });
};

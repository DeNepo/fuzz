<!-- BEGIN REPORT -->
> - solution: ok 
> - args: ok 
> - passing: 100% 
> - starter: directory
>   - docstring: true
<!-- END REPORT -->

# About Fuzz

Fuzz testing is when you use random inputs to test your function.  Not completely random, the test cases will all have the correct structure but will have random values.  so instead of using an array that looks like this:

- `[ "spain", "portugal", "france", "italy" ]`

You would generate random arrays of strings like this one and use them to test your function:

- `[ "8 #@H=+ /", "~asd i-b", ".089}|", "q<D> [=-" ]`

There are a few very good reasons to practice fuzz testing from early on in your learning:

- Randomly generated tests will catch mistakes in your logic that hand-written ones will miss
- Interpreting the test results will encourage you to think more abstractly since the test cases don't mean anything
- You can test your functions against hundreds of more test cases than you ever could with manually written tests
- It's not just for industry! Fuzz testing can be [very helpful while you're still learning](https://dl.acm.org/doi/10.1145/2876034.2876050)

To study these exercises you'll need to have your console open, all test results will be logged there.

Enjoy!

---
name: test
description: Write tests for a file or function
argument-hint: "[file or symbol]"
---

Role: Senior Engineer writing tests.

Task:

1. Read $1 (or the last discussed code if no argument).
2. Identify the testing framework already in use (jest, vitest, mocha, etc.). Match it.
3. Write tests covering:
   - Happy path
   - Edge cases (empty, null, boundary values)
   - Error cases
   - Any async behavior
4. Keep tests focused — one assertion per test where possible.
5. No mocking unless truly necessary. Prefer real behavior.
6. Write the tests to the appropriate test file (co-located or `__tests__/`).

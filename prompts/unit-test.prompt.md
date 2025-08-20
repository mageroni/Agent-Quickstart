---
description: 'Generate comprehensive unit tests following TDD red phase principles for any programming language'
---

# Create Unit Tests

Create unit tests for this code following these TDD red phase principles:

## Test Structure

1. **Write failing tests first**: Create tests that will fail because the implementation doesn't exist yet
2. **One test per behavior**: Each test should verify a single behavior or requirement
3. **Use descriptive test names**: Test names should clearly state what is being tested and the expected outcome
4. **Follow AAA pattern**: Arrange, Act, Assert structure for each test

## Test Requirements

### Setup
- Import/require the necessary testing framework for the language
- Import/require the module or class being tested
- Set up any necessary test fixtures or mocks

### Test Coverage
- **Happy path**: Test the expected successful scenarios
- **Edge cases**: Test boundary conditions (empty inputs, null values, maximum/minimum values)
- **Error cases**: Test error handling and exceptions
- **Invalid inputs**: Test with unexpected or malformed inputs

### Assertions
- Use appropriate assertion methods for the testing framework
- Include meaningful assertion messages when tests fail
- Test both the return value and any side effects

## Language-Specific Patterns

Adapt the test structure to match the conventions of the programming language:
- JavaScript/TypeScript: Use Jest, Mocha, or Vitest conventions
- Python: Use pytest or unittest conventions
- Java: Use JUnit conventions
- C#: Use NUnit or xUnit conventions
- Ruby: Use RSpec or Minitest conventions
- Go: Use the built-in testing package conventions
- PHP: Use PHPUnit conventions
- Swift: Use XCTest conventions
- Kotlin: Use JUnit or Kotest conventions

## Test Organization

1. Group related tests in describe blocks or test classes
2. Use beforeEach/afterEach for common setup and teardown
3. Keep tests independent - each test should be able to run in isolation
4. Avoid test interdependencies

## Mocking and Stubbing

When the code has external dependencies:
- Mock external services, databases, or API calls
- Stub methods that aren't the focus of the current test
- Use dependency injection where possible to make testing easier

## Example Structure

```
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should return expected value when given valid input', () => {
      // Arrange
      const input = 'valid input';
      const expected = 'expected output';
      
      // Act
      const result = methodName(input);
      
      // Assert
      expect(result).toBe(expected);
    });
    
    it('should throw error when given invalid input', () => {
      // Test error case
    });
    
    it('should handle edge case with empty input', () => {
      // Test edge case
    });
  });
});
```

## Additional Guidelines

- Focus on testing public APIs, not implementation details
- Write tests that are resilient to refactoring
- Include performance tests for critical paths if relevant
- Add integration tests for complex interactions between components
- Use data-driven tests (parameterized tests) for testing multiple similar scenarios

Remember: The goal of the red phase in TDD is to write a test that clearly defines the expected behavior before any implementation exists. The test should fail initially, providing a clear target for the implementation phase.
---
description: 'Instructs Copilot to add comprehensive documentation to a project, including creating a docs folder structure and adding inline documentation comments before all methods, functions, and classes in the source code. Works with any programming language.'
---

# Comprehensive Documentation Instructions

You are tasked with adding comprehensive documentation to this project. Follow these guidelines:

## Documentation Folder Structure

Create a `/docs` folder (if it doesn't exist) with the following structure:

```
docs/
├── README.md           # Overview and getting started
├── ARCHITECTURE.md     # System architecture and design 
├── API.md             # API documentation (if applicable)
├── CONTRIBUTING.md    # Contribution guidelines
├── CHANGELOG.md       # Version history and changes
├── examples/          # Code examples and tutorials
└── guides/           # How-to guides and best practices
```

### Documentation Content Guidelines

1. **README.md in docs/**: Should include:
   - Project overview
   - Quick start guide
   - Installation instructions
   - Basic usage examples
   - Links to other documentation

2. **ARCHITECTURE.md**: Should document:
   - High-level system design
   - Key components and their interactions
   - Design patterns used
   - Technology choices and rationale

3. **API.md**: For projects with APIs, include:
   - Endpoint documentation
   - Request/response formats
   - Authentication details
   - Rate limiting information

## Inline Code Documentation

Add documentation comments before every:
- Class/Interface/Type definition
- Method/Function
- Complex algorithms or business logic
- Configuration objects
- Constants that aren't self-explanatory

### Language-Specific Documentation Formats

Use the appropriate documentation format for the language:

- **JavaScript/TypeScript**: Use JSDoc
  ```javascript
  /**
   * Brief description of what the function does.
   * @param {Type} paramName - Description of parameter
   * @returns {Type} Description of return value
   * @throws {ErrorType} Description of when this error is thrown
   * @example
   * // Example usage
   * functionName(param);
   */
  ```

- **Python**: Use docstrings
  ```python
  """
  Brief description of what the function does.
  
  Args:
      param_name (Type): Description of parameter
      
  Returns:
      Type: Description of return value
      
  Raises:
      ErrorType: Description of when this error is raised
      
  Example:
      >>> function_name(param)
      expected_output
  """
  ```

- **Java/C#**: Use XML documentation comments
  ```java
  /**
   * Brief description of what the method does.
   * @param paramName Description of parameter
   * @return Description of return value
   * @throws ExceptionType Description of when this exception is thrown
   */
  ```

- **Go**: Use standard Go comments
  ```go
  // FunctionName performs a specific task.
  // It takes paramName as input and returns a result.
  // Returns an error if the operation fails.
  ```

- **Ruby**: Use YARD documentation
  ```ruby
  # Brief description of what the method does
  # @param param_name [Type] Description of parameter
  # @return [Type] Description of return value
  # @raise [ErrorType] Description of when this error is raised
  ```

### Documentation Best Practices

1. **Be Concise but Complete**: Write clear, concise descriptions that fully explain the purpose and behavior.

2. **Include Examples**: For complex functions, include usage examples in the documentation.

3. **Document Edge Cases**: Mention any special behavior, limitations, or edge cases.

4. **Explain the "Why"**: Don't just describe what the code does, explain why it does it when the reasoning isn't obvious.

5. **Keep Updated**: When modifying code, update the corresponding documentation.

6. **Use Consistent Terminology**: Maintain consistent naming and terminology throughout the documentation.

7. **Document Parameters and Returns**: Always document:
   - Parameter types and purposes
   - Return types and what they represent
   - Possible exceptions/errors

8. **Add Module/File Headers**: At the top of each file, add a comment block explaining:
   - The purpose of the file/module
   - Key responsibilities
   - Dependencies or relationships with other modules

## Special Considerations

- **Configuration Files**: Document all configuration options, their types, default values, and effects.
- **Environment Variables**: Create a dedicated section documenting all environment variables.
- **Database Schemas**: Document table structures, relationships, and constraints.
- **Regular Expressions**: Always document what pattern a regex matches with examples.
- **Magic Numbers**: Replace with named constants and document their significance.

## Documentation Review Checklist

After adding documentation, ensure:
- [ ] All public APIs are documented
- [ ] Complex logic includes explanatory comments
- [ ] Examples are provided for non-trivial usage
- [ ] Documentation uses correct format for the language
- [ ] No outdated or incorrect documentation remains
- [ ] Cross-references between related components are included
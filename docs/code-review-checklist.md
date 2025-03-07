# Code Review Checklist

## Code Structure
- [ ] Component nesting is 3 levels or less
- [ ] Component files are under 150 lines
- [ ] File naming follows conventions
- [ ] Imports are properly organized and grouped
- [ ] Absolute imports are used for project modules

## AI Implementation
- [ ] Prompt templates are documented with version numbers
- [ ] Model fallbacks are implemented where appropriate
- [ ] AI responses are validated against schemas
- [ ] Retry logic uses exponential backoff
- [ ] Token usage is optimized

## Performance
- [ ] Long lists use virtualization
- [ ] React.memo is used for frequently rendered components
- [ ] useMemo/useCallback are used appropriately
- [ ] Database queries are optimized
- [ ] Network requests are batched where possible

## UX & Accessibility
- [ ] User/AI messages have clear visual distinction
- [ ] Loading states are properly indicated
- [ ] Keyboard navigation is supported
- [ ] WCAG 2.1 AA compliance is maintained
- [ ] Error messages are user-friendly

## Security
- [ ] User inputs are sanitized
- [ ] Authentication uses secure methods
- [ ] File uploads are validated
- [ ] Prompt injection protections are in place

## Testing
- [ ] Unit tests cover utility functions
- [ ] Integration tests cover AI service interactions
- [ ] Core functionality has adequate test coverage
- [ ] Edge cases are tested

## Documentation
- [ ] Exported functions have JSDoc comments
- [ ] Component props are documented with TypeScript
- [ ] Complex logic has explanatory comments
- [ ] Changes are documented with reasoning

## General
- [ ] Code is simple and modular
- [ ] No unnecessary complexity
- [ ] Comments explain the "why" not just the "what"
- [ ] Changes are minimal and focused 
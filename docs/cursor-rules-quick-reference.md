# Cursor Project Rules - Quick Reference

## Code Structure
- Component nesting: max 3 levels deep
- Component files: <150 lines
- File naming: PascalCase (components), camelCase (utils/hooks), kebab-case (CSS)
- Import order: React/Next.js → external libs → internal components → types → styles

## AI Implementation
- Document prompt templates with version numbers
- Implement model fallbacks (GPT-4 → GPT-3.5)
- Validate AI responses against schemas
- Use exponential backoff for retries

## Performance
- Virtualize long chat histories
- Use React.memo, useMemo, useCallback
- Implement edge functions for latency-sensitive ops
- Optimize database queries with proper indexing

## UX & Accessibility
- Clear visual distinction between user/AI messages
- WCAG 2.1 AA compliance
- User-friendly error messages
- Support keyboard navigation

## Security
- End-to-end encryption for sensitive conversations
- HTTP-only cookies for sessions
- Sanitize all user inputs
- Prevent prompt injection attacks

## Testing
- 80%+ test coverage for core functionality
- Unit tests for utility functions
- Integration tests for AI services
- Accessibility testing in CI pipeline

## Documentation
- JSDoc for exported functions
- Document component props with TypeScript interfaces
- Maintain architecture diagrams
- Document AI model limitations

## Development Process
- Think before coding
- Write simple, clean, modular code
- Test after every meaningful change
- Make minimal necessary changes when fixing bugs
- Add helpful comments, never delete old ones unless wrong

## Comments
- Add explanatory comments to complex logic
- Document the "why" not just the "what"
- Use clear, short sentences
- Document all changes and their reasoning 
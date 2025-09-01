# Contributing Guide

Thank you for your interest in contributing to this project! We welcome contributions from the community and are grateful for any help you can provide.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully
- Put the project's best interests first

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/your-fork.git
   cd your-fork
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/original-repo.git
   ```
4. **Keep your fork updated**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- [Docker](https://docker.com) and Docker Compose
- [Git](https://git-scm.com)
- A code editor (VS Code recommended)

### Local Development

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up environment**:
   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/client/.env.example apps/client/.env
   ```

3. **Start databases**:
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run migrations**:
   ```bash
   cd apps/server && bun run db:push
   ```

5. **Start development servers**:
   ```bash
   bun run dev
   ```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Check if the feature has been suggested in [Issues](../../issues)
2. Create a new issue using the feature request template
3. Explain:
   - The problem your feature solves
   - How you envision it working
   - Any alternatives you've considered

### Contributing Code

1. **Find an issue** to work on or create one
2. **Comment** on the issue to let others know you're working on it
3. **Create a branch** for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our coding standards
5. **Write/update tests** as needed
6. **Update documentation** if required
7. **Submit a pull request**

## Pull Request Process

### Before Submitting

1. **Test your changes**:
   ```bash
   bun run lint
   bun run typecheck
   bun run build
   ```

2. **Update documentation** if you've changed APIs or added features

3. **Write clear commit messages** following our guidelines

4. **Ensure no conflicts** with the main branch

### Submitting a PR

1. **Push your branch** to your fork
2. **Create a pull request** from your fork to the main repository
3. **Fill out the PR template** completely
4. **Link related issues** using keywords like "Fixes #123"
5. **Wait for review** and address any feedback

### PR Review Process

- All PRs require at least one review
- Maintainers may request changes
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add types for all functions and variables
- Avoid `any` type unless absolutely necessary

```typescript
// Good
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
function calc(i: any) {
  return i.reduce((s: any, x: any) => s + x.p, 0);
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Extract reusable logic into custom hooks

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

### File Organization

- One component per file
- Group related files in folders
- Use index files for exports
- Keep test files next to source files

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      index.ts
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes

### Examples

```bash
# Feature
feat(auth): add OAuth2 login support

# Bug fix
fix(api): correct user validation error

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(components): simplify Button component logic
```

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

```typescript
describe('calculateTotal', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should sum all item prices', () => {
    const items = [
      { price: 10 },
      { price: 20 },
      { price: 30 }
    ];
    expect(calculateTotal(items)).toBe(60);
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include examples in comments
- Document complex logic
- Keep comments up-to-date

```typescript
/**
 * Calculates the total price of items in the cart
 * @param items - Array of cart items
 * @returns Total price as a number
 * @example
 * const total = calculateTotal([
 *   { price: 10 },
 *   { price: 20 }
 * ]); // Returns 30
 */
function calculateTotal(items: CartItem[]): number {
  // ...
}
```

### README Updates

- Update README for new features
- Include usage examples
- Document breaking changes
- Add badges for new integrations

## Community

### Getting Help

- Check the [documentation](./README.md)
- Search existing [issues](../../issues)
- Ask in [discussions](../../discussions)
- Reach out to maintainers

### Staying Updated

- Watch the repository for updates
- Join our community discussions
- Follow the project blog/changelog
- Subscribe to release notifications

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Our contributors page

Thank you for contributing! 🎉
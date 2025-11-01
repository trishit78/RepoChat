# Contributing to RepoChat 🚀

Thank you for your interest in contributing to RepoChat! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Node.js 18+** installed
2. **PostgreSQL** with pgvector extension
3. **Git** for version control
4. A **GitHub account**
5. Basic knowledge of:
   - TypeScript
   - React/Next.js
   - tRPC
   - Prisma

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/repochat.git
   cd repochat
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/repochat.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

6. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

7. **Start the development server**
   ```bash
   npm dev
   ```

## 🔄 Development Workflow

### Creating a New Feature

1. **Sync with upstream**
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in the PR template

## 💻 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript**: Enable all strict checks
- **Type everything**: Avoid `any` unless absolutely necessary
- **Use interfaces** for object shapes
- **Use type** for unions, intersections, or primitives

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { ... };
```

### React/Next.js Guidelines

- **Use functional components** with hooks
- **Keep components small** and focused
- **Use Server Components** by default (add "use client" only when needed)
- **Implement proper error boundaries**

```typescript
// Good - Server Component by default
export default function Dashboard() {
  return Dashboard;
}

// Only when needed
"use client";
export default function InteractiveComponent() {
  const [state, setState] = useState();
  return Interactive;
}
```

### tRPC Guidelines

- **Validate all inputs** with Zod schemas
- **Use appropriate procedures**: `publicProcedure` vs `protectedProcedure`
- **Handle errors gracefully**
- **Add JSDoc comments** for complex procedures

```typescript
export const userRouter = createTRPCRouter({
  getUser: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUnique({
        where: { id: input.id }
      });
    }),
});
```

### Prisma Guidelines

- **Use descriptive model names**
- **Add proper indexes** for performance
- **Use soft deletes** where appropriate
- **Document complex queries**

```prisma
model Project {
  id        String   @id @default(cuid())
  name      String
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **React Server Components**: default export, PascalCase filename
- **React Client Components**: "use client" directive, PascalCase filename

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

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
- **chore**: Maintenance tasks

### Examples

```bash
feat(dashboard): add commit history visualization

- Implemented commit timeline component
- Added filtering by date range
- Integrated with tRPC API

Closes #123
```

```bash
fix(auth): resolve token refresh issue

Fixed a bug where authentication tokens weren't
being refreshed correctly after expiration.

Fixes #456
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review of your code completed
- [ ] Comments added to complex code
- [ ] Documentation updated if needed
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] Dependent changes merged

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests pass
```

### Review Process

1. **Automated checks**: CI/CD must pass
2. **Code review**: At least one maintainer approval
3. **Address feedback**: Make requested changes
4. **Merge**: Maintainer will merge when ready

## 📁 Project Structure Guidelines

### Adding New Routes

```typescript
// src/app/(protected)/new-feature/page.tsx
export default function NewFeaturePage() {
  return New Feature;
}
```

### Adding New API Endpoints

```typescript
// src/server/api/routers/newRouter.ts
export const newRouter = createTRPCRouter({
  // Add procedures here
});

// src/server/api/root.ts
export const appRouter = createTRPCRouter({
  // ...existing routers
  newRouter: newRouter,
});
```

### Adding New Components

```typescript
// src/components/ui/new-component.tsx
export function NewComponent({ ... }: Props) {
  return Component;
}
```

## 🧪 Testing

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render correctly', () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Comments

- **Use JSDoc** for functions and complex logic
- **Explain WHY**, not WHAT
- **Keep comments up-to-date**

```typescript
/**
 * Summarizes a git commit using AI
 * @param diff - The git diff string
 * @returns A human-readable summary
 * @throws Error if API request fails
 */
export async function summarizeCommit(diff: string): Promise {
  // Implementation
}
```

### README Updates

When adding new features:
- Update the features list
- Add configuration instructions
- Include usage examples
- Document any new environment variables

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's reproducible
3. Test with latest version

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 18.17.0]
```

## 💡 Feature Requests

### Suggesting Features

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives**
Other approaches considered

**Additional Context**
Any other information
```
## 📧 Getting Help

- **GitHub Discussions**: Ask questions
- **Issues**: Report bugs or request features
- **Email**: trishit456@gmail.com

## 🎉 Thank You!

Every contribution, no matter how small, is valued and appreciated. Thank you for helping make RepoChat better!

---

**Questions?** Feel free to reach out to the maintainers or open a discussion on GitHub.

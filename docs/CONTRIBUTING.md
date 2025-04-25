# Contributing to @glandjs/emitter

Thank you for your interest in contributing to **@glandjs/emitter**! This package provides a fast, minimal, and zero-dependency EventEmitter designed for scalable and event-driven applications. Your contributions help improve performance, flexibility, and reliability of the emitter core.

---

## Table of Contents

- [Contributing to @glandjs/emitter](#contributing-to-glandjsemitter)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Reporting Issues](#reporting-issues)
  - [Feature Requests](#feature-requests)
  - [Submitting Pull Requests](#submitting-pull-requests)
  - [Development Setup](#development-setup)
  - [Coding Guidelines](#coding-guidelines)
  - [Commit Message Format](#commit-message-format)
  - [Thank You](#thank-you)

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). Please make sure to read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## Getting Started

### Prerequisites

- [**Bun**](https://bun.sh) v1.0 or higher
- [**Git**](https://git-scm.com/) for version control
- Familiarity with **TypeScript** (the codebase is fully typed)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/glandjs/emitter.git
   cd emitter
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

---

## Reporting Issues

If you find a bug or unexpected behavior:

1. Check existing issues to avoid duplication.
2. Open a new issue and include:
   - A clear title and description
   - Steps to reproduce the issue
   - Expected vs. actual behavior
   - Environment details (OS, Bun version, etc.)

---

## Feature Requests

To suggest a new feature:

1. Create an issue with the `feature` label.
2. Explain the feature's purpose and use case.
3. Discuss it with maintainers and the community.
4. Once approved, you may start implementation via a Pull Request.

---

## Submitting Pull Requests

1. Fork the repo and create a branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes in `src/` and update/add tests in `tests/`.
3. Run tests:
   ```bash
   bun test
   ```
4. Run benchmarks (if needed):
   ```bash
   bun bench/benchmark.ts
   ```
5. Commit with a clear message (see [Commit Message Format](#commit-message-format))
6. Push and open a Pull Request against `main`

**Pull Request Checklist:**

- [ ] Tests written for new features or bug fixes
- [ ] Linting and type-checking pass
- [ ] Benchmark impact considered (for perf-related changes)
- [ ] No external dependencies introduced

---

## Development Setup

- **Build:** `bun run build`
- **Test:** `bun test`
- **Benchmark:** `bun bench/benchmark.ts`
- **Run example:** `bun examples/*.ts`

---

## Coding Guidelines

- **Zero Dependencies**: Avoid adding any external libraries.
- **Performance First**: Every operation should aim for O(1) or O(log n) complexity.
- **Wildcard Matching**: Must be accurate and fast (consider radix trees or optimized trie structures).
- **Strict TypeScript**: Fully typed, no `any` unless absolutely unavoidable.
- **Tests**: All edge cases and wildcards must be tested.

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:**

- `feat`: new feature
- `fix`: bug fix
- `perf`: performance improvement
- `refactor`: code restructuring
- `test`: test-related changes
- `docs`: documentation only
- `chore`: build or tooling changes

**Example:**

```
feat(emitter): add wildcard support for nested events
```

---

## Thank You

We appreciate your contributions to **@glandjs/emitter**! Your efforts help make it the most efficient and elegant event system for event-driven JavaScript and TypeScript applications.
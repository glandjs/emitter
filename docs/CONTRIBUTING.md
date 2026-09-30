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

The repository uses a git-flow layout managed with [`gix`](https://github.com/glandjs/gix):

```
main
 └── develop
      ├── feature/*   new capability
      ├── bugfix/*    correctness fix
      ├── hotfix/*    urgent fix, from main
      └── release/*   version bump
```

1. Branch off `develop` with the kind that matches your change:
   ```bash
   gix feature start my-feature
   gix bugfix start my-fix
   ```
2. Make your changes in `src/` and add tests in `tests/`.
3. Verify everything before committing:
   ```bash
   bun run verify
   ```
4. Add a changeset describing the user-visible change:
   ```bash
   bunx changeset
   ```
5. Commit. A `commit-msg` hook runs [commitlint](#commit-message-format), and a `pre-push` hook rebuilds and reruns the suite.
6. Merge back when done:
   ```bash
   gix feature finish my-feature
   gix bugfix finish my-fix
   ```

**Pull Request Checklist:**

- [ ] A changeset is included for any user-visible change
- [ ] Tests written for new features or bug fixes
- [ ] `bun run verify` passes
- [ ] Benchmark impact considered (for perf-related changes)
- [ ] No runtime dependencies introduced

---

## Development Setup

| Command                | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `bun run build`        | Compile to `dist/`                         |
| `bun run clean`        | Remove `dist/`                             |
| `bun run typecheck`    | `tsc --noEmit`                             |
| `bun run format`       | Rewrite files with Prettier                |
| `bun run format:check` | Fail if anything is unformatted            |
| `bun run test`         | Run the suite (imports from `dist/`)       |
| `bun run bench`        | Throughput benchmark against Node          |
| `bun run verify`       | Format, typecheck, build and test in order |
| `bun run pack`         | Produce a tarball for inspection           |
| `bunx changeset`       | Record a pending release                   |

Note that the test suite imports from `dist/`, so run `bun run build` before
`bun run test` on a fresh clone. `bun run verify` and the `pre-push` hook both
handle this for you.

**Run an example:** `bun run examples/wildcard-pattern.ts`

---

## Coding Guidelines

- **Zero Dependencies**: Avoid adding any runtime libraries.
- **Performance First**: Every operation should aim for O(1) or O(log n) complexity.
- **Wildcard Matching**: Must be accurate and fast.
- **Strict TypeScript**: Fully typed, no `any` unless absolutely unavoidable.
- **Tests**: All edge cases and wildcards must be tested.
- **One node shape**: Keep the internal tree uniform. A path segment that is
  both a leaf and a prefix must not be represented differently depending on
  registration order — that is what previously made `on` throw and `off` prune
  live listeners.

---

## Release Process

Releases are automated with [changesets](https://github.com/changesets/changesets).

1. Every user-visible change adds a file under `.changeset/` via `bunx changeset`.
2. Merging into `main` runs `.github/workflows/release.yml`.
3. That workflow opens or updates a **Version Packages** pull request, which bumps
   `package.json`, updates `CHANGELOG.md`, and consumes the changesets.
4. Merging the version pull request publishes to npm and creates a Git tag.
5. Pre-release tags are available as `alpha` and `beta` via
   `bun run release:alpha` and `bun run release:beta`.

A commit that only touches CI, docs or tests does not need a changeset.

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

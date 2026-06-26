# Contributing to SMS Gateway Platform

Thank you for your interest in contributing to the SMS Gateway SaaS Platform! This document provides guidelines for setting up your development environment, coding standards, and submitting contributions.

---

## Code of Conduct

We expect all contributors to adhere to standard respectful interactions:
* Use welcoming and inclusive language.
* Be respectful of differing viewpoints and experiences.
* Gracefully accept constructive criticism.

---

## Branching Model

We follow a simple Git branching model:
* **`main`**: Represents the stable, production-ready codebase.
* **Feature Branches (`feat/...`, `fix/...`, `refactor/...`)**: All developments, features, and fixes should occur on isolated branches split from `main`.

---

## Commit Message Guidelines

We enforce **Conventional Commits** to keep git logs clear and clean. Your commit messages must follow this structure:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types
* `feat`: A new feature (e.g., adding user notifications).
* `fix`: A bug fix (e.g., resolving a websocket reconnection issue).
* `docs`: Documentation modifications (e.g., updating the readme).
* `refactor`: Code changes that neither fix bugs nor add features.
* `chore`: Build steps, auxiliary tool updates, dependency modifications.

### Example
```text
feat(backend): add rate limiting on send-otp endpoint

Implements a 1-minute window rate limit for OTP dispatch to prevent carrier billing abuse.
```

---

## Development Workflow

1. **Fork & Clone**: Fork the repository on GitHub and clone your fork locally.
2. **Setup Workspaces**: Run `npm install` at the root of the workspace to install dependencies for all applications and packages.
3. **Make Changes**: Implement your logic, following the existing lint configurations and coding guidelines.
4. **Format & Lint**:
   * Run format check: `npm run format` (run Prettier formatting).
   * Run lint check: `npm run lint` (run ESLint checkers).
5. **Verify Types**: Compile code using `npm run build` to make sure type errors don't occur.
6. **Submit PR**: Open a pull request targeting the `main` branch. Provide a clear description of your changes and reference any related issues.

---

## Coding Standards

* **TypeScript Strict Mode**: Keep strict types enabled. Avoid using the `any` type wherever possible.
* **Component Design**:
  * In the **Backend (NestJS)**, utilize global Exception Filters, DTO validation, and write business logic inside services, not controllers.
  * In the **Dashboard (React)**, use functional components and hooks. Keep CSS declarations centralized using Material UI theme overrides.
  * In the **Mobile app (React Native)**, utilize platform-specific permissions validation before accessing native Android modules.
* **File Naming**: Use kebab-case for directories and standard TypeScript files (e.g. `devices.controller.ts`, `devices.gateway.ts`).

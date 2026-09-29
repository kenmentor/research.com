## ADDED Requirements
### Requirement: Next.js App Router TypeScript Project Boots
The project SHALL provide a Next.js App Router TypeScript application that installs cleanly, starts in development and production modes, and renders the root layout with no type errors.
#### Scenario: Clean install and boot
- **WHEN** a developer runs package install followed by dev and build plus start commands
- **THEN** all commands succeed and the root route returns HTTP 200 with the root layout rendered
### Requirement: Cached Mongoose Connection
The data layer SHALL expose a cached Mongoose connection helper that reuses a single connection across hot-reloads and serverless invocations and MUST fail fast when the connection string is missing.
#### Scenario: Reused connection across calls
- **WHEN** the connection helper is invoked multiple times during a server lifecycle
- **THEN** only one underlying MongoDB connection is created and subsequent calls return the cached instance
### Requirement: Zod Environment Validation Fails Fast
The application SHALL validate all required environment variables with Zod at startup and MUST throw a descriptive error and halt boot when any required variable is missing or malformed.
#### Scenario: Missing variable blocks boot
- **WHEN** the application boots without a required environment variable defined
- **THEN** startup halts with a validation error naming the missing variable before any route or database connection initializes
### Requirement: Shared API Envelope and Error Handler
The API layer SHALL use a shared success envelope and a centralized error handler that maps known errors to correct HTTP status codes with a stable error shape and MUST never leak stack traces to clients.
#### Scenario: Consistent error shape
- **WHEN** an API route throws validation, not-found, or unexpected errors
- **THEN** responses use the shared envelope with status-appropriate codes and a stable code plus message body without stack traces
### Requirement: CI Lint and Typecheck Gate
The CI pipeline SHALL run lint and strict typecheck on every pull request and MUST block merge when either check fails.
#### Scenario: Failing check blocks merge
- **WHEN** a pull request contains lint or type errors
- **THEN** the CI gate reports failure and the pull request cannot merge until the errors are fixed

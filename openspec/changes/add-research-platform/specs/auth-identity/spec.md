## ADDED Requirements
### Requirement: Email and Google Login via Auth.js
The authentication system SHALL support email magic-link and Google OAuth sign-in through Auth.js with persisted sessions and MUST reject invalid or expired credentials without creating a session.
#### Scenario: Successful sign-in creates session
- **WHEN** a user completes valid email magic-link verification or Google OAuth consent
- **THEN** a persisted session is created and the user is redirected to onboarding when profile-incomplete or to the home feed when profile-complete
### Requirement: Onboarding Wizard Creates Profile
The onboarding flow SHALL present a multi-step wizard that collects required profile fields with validation and MUST create exactly one user profile record on completion.
#### Scenario: Wizard completion
- **WHEN** a new authenticated user submits all required wizard steps with valid data
- **THEN** exactly one profile record is created and the user lands on the home feed with onboarding marked complete
### Requirement: Middleware Protects Main Routes
The middleware SHALL require an authenticated session for all main application routes and MUST redirect unauthenticated visitors to the login page while allowing public auth callbacks.
#### Scenario: Unauthenticated access redirect
- **WHEN** an unauthenticated visitor requests a protected main route
- **THEN** the request is redirected to the login page and the protected content is never rendered
### Requirement: Logout Clears Session
The logout action SHALL terminate the server session and clear all client session artifacts and MUST prevent reuse of the prior session token.
#### Scenario: Session termination
- **WHEN** an authenticated user triggers logout
- **THEN** the server session is destroyed, client cookies are cleared, and subsequent requests with the old token are treated as unauthenticated
### Requirement: Account Settings Update
The account settings screen SHALL allow an authenticated user to update display name, handle, bio, and notification preferences with inline validation and MUST persist changes and reflect them immediately in the interface.
#### Scenario: Settings persistence
- **WHEN** a user saves valid account settings changes
- **THEN** the profile record is updated, a success confirmation appears, and the updated values render in the header and profile views without reload

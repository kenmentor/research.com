## ADDED Requirements
### Requirement: Public Profile Header
The system SHALL render public route `/in/[username]` with cover image, avatar, display name, headline, current affiliation, location, and verification badge, returning 404 for unknown usernames.
#### Scenario: Visitor opens public profile
- **WHEN** a visitor navigates to `/in/[username]` for an existing user
- **THEN** the header displays cover, avatar, headline, affiliation, and location, and unknown usernames return 404
### Requirement: Profile Action Row
The system SHALL display an action row with Connect, Message, Follow, and More buttons whose states reflect the viewer relationship and profile ownership.
#### Scenario: Viewer checks action row states
- **WHEN** an authenticated viewer opens another researcher's profile
- **THEN** Connect, Message, Follow, and More reflect pending, connected, following, and ownership states correctly
### Requirement: Profile Content Sections
The system SHALL render About, Interests, Experience, Education, and Grants sections with empty-state prompts when data is absent and chronological ordering for time-based entries.
#### Scenario: Profile sections render completely
- **WHEN** a profile with all sections populated is viewed
- **THEN** About, Interests, Experience, Education, and Grants appear in order with correct empty states for missing data
### Requirement: Profile Edit Mode
The system SHALL provide owner-only edit mode with validated forms for each section, rejecting invalid inputs and persisting valid changes to MongoDB.
#### Scenario: Owner edits profile sections
- **WHEN** the profile owner submits section forms with valid and invalid data
- **THEN** valid changes persist and invalid inputs are rejected with inline errors without partial saves
### Requirement: Per-Section Privacy Controls
The system SHALL enforce per-section visibility of public or connections-only, hiding restricted sections and fields from unauthorized viewers server-side.
#### Scenario: Privacy restricts section visibility
- **WHEN** a logged-out visitor and a non-connection view a profile with connections-only sections
- **THEN** restricted sections are hidden while public sections remain visible and connections retain full access
### Requirement: Completeness Meter and Discovery Rails
The system SHALL display a profile completeness meter to the owner plus a stats rail and people-also-viewed rail computed from profile data and graph similarity.
#### Scenario: Completeness and rails display
- **WHEN** the owner and a visitor view a profile
- **THEN** the owner sees a completeness percentage with missing-item prompts while visitors see stats rail and people-also-viewed suggestions

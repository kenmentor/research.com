## ADDED Requirements

### Requirement: Notification center with grouping and unread state
The system SHALL provide a bell center that groups notifications by type — connects, accepts, messages, cites, mentions — and tracks unread status per item and per group.

#### Scenario: Grouped unread display
- **WHEN** a user opens the bell center with pending connects, messages, and cites
- **THEN** items are grouped under connects / messages / cites headers with unread counts shown per group and in total

#### Scenario: Empty state
- **WHEN** a user with zero notifications opens the bell center
- **THEN** an empty state is shown with zero unread count and no groups rendered

### Requirement: Transactional and digest emails via Resend
The system SHALL send welcome, connection-request, and unread-digest emails via Resend with idempotent delivery per trigger event.

#### Scenario: Welcome email on signup
- **WHEN** a new account is verified
- **THEN** exactly one welcome email is queued via Resend within 1 minute

#### Scenario: Unread digest batching
- **WHEN** a user has unread notifications at the scheduled digest time
- **THEN** a single digest email summarizing unread items is sent and no duplicate digest is sent for the same period

### Requirement: Per-type notification preferences
The system SHALL provide per-type Switch preferences that gate in-app and email delivery for each notification type.

#### Scenario: Disabled type suppresses delivery
- **WHEN** a user disables the "mentions" Switch and another user mentions them
- **THEN** no in-app mention item and no mention email are created for the opted-out user

#### Scenario: Preference persistence
- **WHEN** a user toggles a preference Switch and reloads settings
- **THEN** the saved Switch state matches the last toggle and governs subsequent delivery

### Requirement: Mark-read clears badges
The system SHALL clear list badges and the bell unread count when notifications are marked read individually or via mark-all-read.

#### Scenario: Mark-all-read clears badge
- **WHEN** a user with 5 unread notifications invokes mark-all-read
- **THEN** unread count becomes 0, the bell badge hides, and all 5 items report read status on refresh

## ADDED Requirements

### Requirement: Conversation list and thread pane
The system SHALL provide a 1-1 messaging layout with conversation list plus thread pane showing history in chronological order.

#### Scenario: Open conversation thread
- **WHEN** a user opens `/messages` and selects a conversation
- **THEN** the system displays the conversation list sorted by `lastMessageAt` desc and the thread pane with the last 50 messages ascending plus participant header

#### Scenario: Start new 1-1 conversation
- **WHEN** a user clicks Message on a connected profile with no existing thread
- **THEN** the system creates one conversation per user pair (unique compound key) and opens an empty thread within 1s

### Requirement: Send persist then broadcast
The system SHALL persist outgoing messages before realtime broadcast via Pusher with polling fallback.

#### Scenario: Send message with realtime delivery
- **WHEN** a user sends text (1-2000 chars) in an accepted conversation
- **THEN** the system persists the message, returns 201 with ID, broadcasts via Pusher to the recipient channel within 1s, and renders it optimistically with retry on failure

#### Scenario: Polling fallback
- **WHEN** Pusher is unreachable for >5s
- **THEN** the system MUST fall back to 5s polling of `/api/conversations/[id]/messages?since=` with no duplicate render and resumes sockets when available

### Requirement: Message delivery states
The system SHALL track and display sent, delivered, and read states per message.

#### Scenario: Read receipt transition
- **WHEN** a recipient opens a thread containing delivered messages
- **THEN** the system marks them read, emits a read event, and the sender sees `sent -> delivered -> read` checkmarks update within 2s

#### Scenario: Persist state across reload
- **WHEN** a user reloads `/messages/[id]`
- **THEN** the system displays the persisted per-message state from the API rather than resetting to sent

### Requirement: Typing indicators and presence
The system SHALL broadcast typing indicators and online/last-active presence for conversation participants.

#### Scenario: Typing indicator
- **WHEN** a user types in an open thread
- **THEN** the system broadcasts `typing:start`/`typing:stop` (stop after 3s idle) and the recipient sees "…typing" cleared within 3.5s

#### Scenario: Presence display
- **WHEN** a user views the conversation list or thread header
- **THEN** the system displays green online dot or `last active Xm ago` from presence heartbeats (30s interval), stale after 90s

### Requirement: Message requests inbox
The system SHALL route messages from strangers to a requests inbox requiring explicit accept before a thread is created.

#### Scenario: Accept message request
- **WHEN** a stranger messages a user
- **THEN** the system stores it in `message_requests` (not the main inbox), shows a Requests tab badge, and on Accept creates the 1-1 thread and moves history there

#### Scenario: Decline or block request
- **WHEN** a user declines or blocks a message request
- **THEN** the system removes the request, creates no thread, and blocks future requests from that sender when Block is chosen

### Requirement: Mobile thread and badges
The system SHALL provide a full-screen mobile thread view with unread badge counts on list, requests, and nav.

#### Scenario: Mobile full-screen thread
- **WHEN** a viewport <768px user selects a conversation
- **THEN** the system displays the thread full-screen with back navigation, sticky composer, and auto-scroll to the latest message

#### Scenario: Unread badges
- **WHEN** new messages arrive in background conversations or requests
- **THEN** the system increments per-conversation unread, total nav badge, and Requests badge, and clears them on thread open with counts reconciled from the API

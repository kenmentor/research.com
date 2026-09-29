## ADDED Requirements
### Requirement: Connection Request Lifecycle
The system SHALL support connection lifecycle of request, accept, decline, withdraw, and remove with single pending state per pair and idempotent transitions persisted to MongoDB.
#### Scenario: Connection request completes lifecycle
- **WHEN** a user sends, then withdraws or receives accept or decline for a connection request
- **THEN** pending, connected, declined, and withdrawn states transition exactly once with no duplicate edges
### Requirement: Follow Versus Connect Distinction
The system SHALL treat follow as one-way subscription to public updates and connect as mutual bidirectional relationship, allowing both states to coexist independently.
#### Scenario: Follow and connect operate independently
- **WHEN** a user follows without connecting, then connects, then unfollows while connected
- **THEN** follow state toggles without affecting connection state and feed visibility follows each rule independently
### Requirement: My Network Management Surface
The system SHALL provide a My Network view with pending invitations, outgoing requests, current connections, and suggested collaborators ranked by mutuals and shared interests.
#### Scenario: User manages network invitations
- **WHEN** a user opens My Network with pending, outgoing, connected, and suggested entries
- **THEN** invitations, requests, connections, and suggestions render with accept, decline, withdraw, and connect actions
### Requirement: Mutual Connections Count
The system SHALL compute and display mutual connection counts on profiles, cards, and suggestions consistently with the underlying social graph.
#### Scenario: Mutual count displays correctly
- **WHEN** a viewer with shared connections opens a profile or suggestion card
- **THEN** the displayed mutual count equals the graph intersection and links to the mutual list
### Requirement: Block Unfollow and Remove Hiding
The system SHALL enforce block, unfollow, and remove actions by hiding blocked or removed users' content, profiles, and messages from the acting user and vice versa for blocks.
#### Scenario: Blocked user content is hidden
- **WHEN** a user blocks, unfollows, or removes a connection
- **THEN** the target's posts, profile, and messages become invisible per action rules and connection edges are severed or downgraded accordingly

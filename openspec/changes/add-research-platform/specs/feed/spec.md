## ADDED Requirements

### Requirement: Post composer
The system SHALL provide a post composer that creates text, link, image, and paper-attach posts with validation and draft clearing on success.

#### Scenario: Create text post
- **WHEN** an authenticated user submits non-empty text (1-5000 chars) with optional link URL
- **THEN** the system persists the post, returns 201 with post ID, and clears the composer within 1s

#### Scenario: Attach paper to post
- **WHEN** a user attaches 1 paper ID and submits the post
- **THEN** the system validates the paper exists, persists the attachment reference, and renders the paper preview card on the created post

#### Scenario: Reject invalid composer payload
- **WHEN** a user submits empty content or an invalid image type (>5MB, non png/jpg/webp)
- **THEN** the system returns 400, persists nothing, and displays an inline field error

### Requirement: Feed list rendering
The system SHALL render the home feed as post cards showing author, timestamp, content, attachment preview, and live like/comment/repost/save counts.

#### Scenario: Render feed cards
- **WHEN** an authenticated user loads `/feed`
- **THEN** the system displays cards in ranked order each showing author name/avatar, relative time, content, attachment (if any), and counts for likes, comments, reposts, and save state

#### Scenario: Empty feed state
- **WHEN** a new user with no connections and no posts in network loads `/feed`
- **THEN** the system displays an empty-state CTA to connect and create a post instead of blank cards

### Requirement: Post interactions
The system SHALL support idempotent like, comment, repost, and save actions with optimistic UI and reconciled counts.

#### Scenario: Like and save post
- **WHEN** a user likes then saves a post
- **THEN** the system records one like and one save per user, increments counts exactly once on retry, and reflects active states within 500ms

#### Scenario: Comment and repost
- **WHEN** a user submits a comment (1-1000 chars) or reposts with optional quote text
- **THEN** the system persists the comment/repost, increments the respective count, and renders the new comment or quoted repost card in the feed

### Requirement: V1 feed ranking
The system SHALL rank V1 feed chronologically with a deterministic connection boost for 1st-degree connections.

#### Scenario: Chronological plus connection boost
- **WHEN** feed candidates include 1st-degree posts from 48h ago and non-connection posts from 1h ago
- **THEN** the system orders by `score = recency + connectionBoost` such that recent 1st-degree posts rank first and ordering is stable for identical inputs

#### Scenario: Ranking excludes hidden content
- **WHEN** ranking candidates include blocked-author or reported-hidden posts
- **THEN** the system MUST exclude those posts before scoring

### Requirement: Cursor pagination and skeletons
The system SHALL paginate the feed with opaque cursors and display skeleton cards during loads.

#### Scenario: Paginate with cursor
- **WHEN** a user scrolls to the end of a 20-item page
- **THEN** the system fetches `?cursor=<opaque>&limit=20`, appends non-duplicate posts, and signals end-of-feed when `nextCursor` is null

#### Scenario: Loading skeletons
- **WHEN** the initial feed query or next page is pending
- **THEN** the system displays 3 skeleton cards and replaces them with real cards or an error retry UI within the request lifecycle

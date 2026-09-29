## ADDED Requirements

### Requirement: Global command search
The system SHALL provide a global Command palette (Cmd+K / Ctrl+K) that searches people, papers, posts, and topics with grouped results and keyboard navigation.

#### Scenario: Search across entities via palette
- **WHEN** a user opens Command with Cmd+K and types a query of >=2 chars
- **THEN** the system debounces 150ms, queries `/api/search?q=`, and displays grouped top-5 results per entity with thumbnail/title/subtitle within 500ms at seed scale

#### Scenario: Navigate to result via keyboard
- **WHEN** a user presses ArrowDown/Enter on a highlighted palette result
- **THEN** the system routes to the entity page (`/profile/[id]`, `/papers/[id]`, `/post/[id]`, or `/topics/[tag]`) and closes the palette

### Requirement: Search filters
The system SHALL support filters for research field, institution, publication year, and venue on people and paper search.

#### Scenario: Filter papers by field year venue
- **WHEN** a user applies `field=ML`, `yearFrom=2022`, `yearTo=2024`, `venue=NeurIPS` to a paper query
- **THEN** the system returns only papers matching all filters and preserves filters in the URL query string

#### Scenario: Filter people by institution
- **WHEN** a user applies `institution=MIT` plus `field=Biology` to a people query
- **THEN** the system returns only matching profiles and shows active filter chips with one-click clear

### Requirement: Search performance and indexes
The system SHALL return search results in <500ms at seed scale (10k papers, 2k users) using MongoDB text indexes.

#### Scenario: Indexed search latency
- **WHEN** a user executes any global search at seed scale with warm indexes
- **THEN** the system responds p95 <500ms and uses `papers_text_idx` / `users_text_idx` compound text indexes (verified via explain plan, no COLLSCAN)

#### Scenario: Empty and short queries
- **WHEN** a user submits an empty query or single character
- **THEN** the system returns trending topics and recent entities instead of a full collection scan

### Requirement: Discovery pages
The system SHALL provide discovery pages at `/discover/people`, `/discover/papers`, and `/topics/[tag]` with lists, sort, and follow actions.

#### Scenario: Browse discover pages
- **WHEN** a user visits `/discover/people` or `/discover/papers`
- **THEN** the system displays filterable lists with sort (relevance, newest, most-cited) and paginates at 20 per page

#### Scenario: Topic page aggregates content
- **WHEN** a user visits `/topics/[tag]` for an existing tag
- **THEN** the system displays the tag header with follower count, related papers, posts, and people, plus a Follow/Unfollow toggle that updates the count

### Requirement: Search relevance and tracking
The system SHALL rank title matches above abstract/body matches and log search queries for trending topics.

#### Scenario: Title match ranks first
- **WHEN** a user searches a phrase matching one paper title and five abstracts
- **THEN** the system orders the title match first with deterministic tie-break by citation count then newest

#### Scenario: Trending from logs
- **WHEN** query logs aggregate over 24h
- **THEN** the system computes top-10 trending topics displayed in the empty Command state, excluding spam queries (>50 identical queries/min per user)

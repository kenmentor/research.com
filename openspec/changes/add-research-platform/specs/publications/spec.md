## ADDED Requirements
### Requirement: Publication CRUD Operations
The system SHALL allow owners to create, update, and delete publications with title, authors, venue, year, DOI, abstract, and tags persisted to MongoDB.
#### Scenario: Owner manages publications
- **WHEN** an owner creates, edits, or deletes a publication
- **THEN** the change persists to MongoDB and appears or disappears from the owner's profile immediately
### Requirement: Publication Validation Rules
The system SHALL validate all publication inputs with Zod requiring non-empty title, at least one author, valid year range, valid DOI format when provided, abstract length limits, and normalized tags.
#### Scenario: Invalid publication is rejected
- **WHEN** a user submits a publication with missing title, no authors, out-of-range year, or malformed DOI
- **THEN** validation fails with field-level errors and nothing is written to MongoDB
### Requirement: Profile Publication List Filtering and Pagination
The system SHALL render a paginated publication list on the profile with keyword search, year range, venue, and tag filters plus sorting by newest and most-cited.
#### Scenario: Visitor filters paginated publications
- **WHEN** a visitor applies keyword, year, venue, or tag filters and changes pages or sort order
- **THEN** only matching publications display in correct page size, order, and total count
### Requirement: Publication Detail Page
The system SHALL render detail route `/pub/[id]` with full metadata, abstract, tags, PDF link, and author names linked to their `/in/[username]` profiles when matched.
#### Scenario: Visitor opens publication detail
- **WHEN** a visitor navigates to `/pub/[id]` for an existing publication
- **THEN** full metadata, abstract, tags, PDF link, and linked authors display, and unknown IDs return 404
### Requirement: Citation Copy and Share
The system SHALL generate copyable APA, MLA, and BibTeX citations from publication metadata and provide a shareable canonical URL with native share fallback to clipboard.
#### Scenario: Visitor copies citation and shares
- **WHEN** a visitor selects APA, MLA, or BibTeX and activates share
- **THEN** the correctly formatted citation copies to clipboard and a canonical share URL is provided or copied
### Requirement: Publication Counters and PDF URL Storage
The system SHALL track reads, downloads, and manual-citation counts per publication and SHALL store PDFs as external URLs only, never persisting raw binary in MongoDB.
#### Scenario: Counters increment and PDF stays URL-only
- **WHEN** a publication is viewed, downloaded, manually cited, and saved with a PDF link
- **THEN** reads, downloads, and manual-citation counters increment once per qualifying event and only the URL string is stored in MongoDB

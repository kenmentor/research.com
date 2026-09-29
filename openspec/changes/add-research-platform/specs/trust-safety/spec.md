## ADDED Requirements

### Requirement: Server-side upload validation with URL-only storage
The system SHALL validate upload type and size server-side and persist only the resulting storage URL, never raw file bytes in MongoDB.

#### Scenario: Rejected oversize or disallowed type
- **WHEN** a client uploads a file exceeding the size limit or with a disallowed MIME type
- **THEN** the server rejects with 400, stores nothing, and no URL record is created

#### Scenario: Valid upload stores URL
- **WHEN** a valid PDF under the size limit is uploaded
- **THEN** the file is stored in object storage and only its URL plus metadata is saved in MongoDB

### Requirement: Report user paper or post with reason
The system SHALL allow authenticated users to report a user, paper, or post with a required reason category and optional details.

#### Scenario: Submit report
- **WHEN** a user submits a report with a valid target ID and reason
- **THEN** a report record is created with reporter ID, target type, reason, and pending status

#### Scenario: Missing reason rejected
- **WHEN** a report is submitted without a reason
- **THEN** the request is rejected with 400 and no report record is created

### Requirement: Bidirectional block hides content
The system SHALL enforce blocks both ways so blocked and blocking users cannot see each other's profiles, papers, posts, messages, or notifications.

#### Scenario: Blocked content hidden both ways
- **WHEN** user A blocks user B
- **THEN** B's content disappears from A's feeds and A's content disappears from B's feeds, messages, and notifications

### Requirement: Admin moderation queue with audit log
The system SHALL provide an admin queue to approve or remove reported content, recording every action in an append-only audit log.

#### Scenario: Admin removal audited
- **WHEN** an admin removes a reported post
- **THEN** the post status becomes removed and an audit log entry records admin ID, action, target, timestamp, and reason

#### Scenario: Non-admin denied
- **WHEN** a non-admin requests the moderation queue or a moderation action
- **THEN** access is denied with 403 and no audit log entry is written

### Requirement: SEO metadata OG tags and sitemap
The system SHALL render metadata, Open Graph tags, and a sitemap for public profile, paper, and post pages.

#### Scenario: Public page metadata present
- **WHEN** a crawler requests a public paper page
- **THEN** the response includes title, description, canonical URL, OG title, OG description, OG image, and OG type

#### Scenario: Sitemap coverage
- **WHEN** `/sitemap.xml` is requested
- **THEN** it lists all public profiles, papers, and posts with lastmod dates and returns 200

### Requirement: Staging and production deploys with observability and backups
The system SHALL maintain staging and production environments with Sentry error reporting and scheduled MongoDB Atlas backups.

#### Scenario: Staging prod separation
- **WHEN** a release is promoted from staging to production
- **THEN** staging and production use separate env configs and databases, and production deploy requires a passing staging check

#### Scenario: Error and backup coverage
- **WHEN** an unhandled server exception occurs and daily backups run
- **THEN** the exception appears in Sentry with stack trace and release tag, and Atlas retains a restorable snapshot from the last 24 hours

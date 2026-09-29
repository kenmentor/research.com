## Why

Researchers lack a single home that combines credible scholarly identity (like Google Scholar) with professional networking (like LinkedIn) and direct messaging. Existing tools split publications, profiles, and conversations across disconnected apps, making it hard to discover work and say "I'm interested in your work, can we connect?".

## What Changes

- New Next.js App Router application (TypeScript) with MongoDB (Mongoose, Atlas) as primary store.
- LinkedIn-inspired, fully responsive UI built strictly from shadcn primitives + Tailwind tokens (3-column desktop, bottom-tab mobile, PWA-ready).
- Researcher identity: auth (email + Google via Auth.js), onboarding wizard, detailed public profiles at `/in/[username]`.
- Publications system: manual CRUD for V1 (title, authors, venue, year, DOI, abstract, tags, PDF URL), detail pages, cite/copy actions, reads/downloads counters; DOI auto-fill and ORCID/Semantic Scholar sync explicitly deferred to Phase 2.
- Social graph: connect request lifecycle (request/accept/decline/withdraw), one-way follows, My Network pages, mutuals, block/unfollow.
- Home feed: composer (text/link/image/paper attach), feed cards, likes/comments/reposts/saves, chronological + connection-boosted ranking V1.
- Discovery: global search (people/papers/posts/topics) with filters, discovery pages, Mongo text indexes.
- 1-1 messaging V1: conversation list + thread pane, sent/delivered/read, typing + presence via Pusher (vendor for V1), paginated history, stranger message-requests inbox. Groups/files/threads/calls deferred.
- Notifications: in-app center + email digests (Resend) + per-type preferences.
- Trust & production hardening: file uploads (avatars/covers/PDFs via S3-compatible, never raw in Mongo), report/block, admin moderation queue + audit log, SEO/OG/sitemaps, Sentry/ logging, Vercel + Atlas staging/prod, backups.
- No breaking changes (greenfield, no existing specs or code).

## Capabilities

### New Capabilities
- `foundation`: Next.js + TypeScript + Mongo/Mongoose setup, env validation, shared libs, CI, folder conventions.
- `design-system`: shadcn-strict theme (LinkedIn tokens), responsive AppShell, composite patterns, dark-mode vars, PWA shell.
- `auth-identity`: sign up/login/logout/sessions, route protection, onboarding, account settings.
- `researcher-profile`: public profile page, sections, edit mode, privacy controls, stats rail, completeness.
- `publications`: publication CRUD, list/filter, detail page, citation tools, V1 metrics.
- `social-graph`: connect lifecycle, follow, network pages, mutuals, block/remove.
- `feed`: composer, feed list, interactions (like/comment/repost/save), V1 ranking.
- `discovery-search`: global Command search, filters, discovery pages, indexes.
- `messaging`: 1-1 conversations, realtime transport, read states, presence/typing, requests inbox, mobile thread UX.
- `notifications`: bell center, email digests, preferences.
- `trust-safety`: uploads validation, report/block, admin queue, audit log, SEO/perf/a11y, deploy/observe, backups.

### Modified Capabilities
- None (greenfield — `openspec/specs/` is empty).

## Impact

- New codebase: Next.js App Router, TypeScript, Tailwind, shadcn/Radix, Mongoose/MongoDB Atlas, Auth.js, Pusher (chat V1), Resend (email), S3-compatible storage, Vercel hosting, Sentry/Axiom.
- New Mongo collections: users, profiles, publications, connections, follows, posts, comments, conversations, messages, notifications, reports, audit_logs.
- New routes: `(auth)`, `(main)` feed/network/profile, `/in/[username]`, `/pub/[id]`, `/messages`, `/notifications`, `/discover/*`, `/admin/*`, `app/api/*`.
- External deps introduced: Atlas, Pusher, Resend, file storage. DOI/Crossref/ORCID integrations explicitly out of V1 scope.

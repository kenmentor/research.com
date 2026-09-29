## Context

Greenfield build in empty repo (`openspec/` only). Stack fixed by user: Next.js + shadcn + MongoDB, LinkedIn-grade UI, fully responsive. Core loop: discover researcher → view credible profile + publications → connect/follow → 1-1 chat. Enterprise/production-grade means auth, moderation, SEO, observability, and backups from the start, not as afterthoughts.

## Goals / Non-Goals

**Goals:**
- Ship V1 loop: onboarding → profile → manual publications → connect/follow → feed → search → 1-1 realtime chat → notifications.
- 100% shadcn-primitive UI (Radix + Tailwind), LinkedIn-inspired density, 3-col desktop / bottom-tab mobile, PWA-ready.
- Production baseline: protected routes, validated APIs, paginated lists, SEO public pages, Sentry/logging, staging+prod, backups.
- Schema-first: Mongoose models with indexes designed for connections-of-connections and citation counters without graph DB.

**Non-Goals:**
- No DOI auto-fill, ORCID/Crossref/Semantic Scholar sync in V1 (manual entry only; Phase 2).
- No group chat, file-sharing in chat, reply threads, or calls in V1 (1-1 text only).
- No ML feed ranking, no computed h-index/i10 in V1 (chronological + connection boost; manual citation counts).
- No SSO/SAML, 2FA, institution workspaces in V1 (stubs only).
- No pixel-clone of LinkedIn brand (inspired theme, own logo/colors to avoid trade-dress risk).

## Decisions

**1. Next.js App Router + TypeScript (over Pages Router / separate backend).**
Single deployable, RSC for public profile/paper SEO, Route Handlers under `app/api/*` for CRUD. Alternatives: Express/Nest split — rejected (ops overhead, slower iteration for small team).

**2. MongoDB Atlas + Mongoose (user-mandated, and fits).**
Flexible profile/publication docs, easy horizontal scale for messages. Connection caching in `lib/db.ts` for serverless. Collections: `users, profiles, publications, connections, follows, posts, comments, conversations, messages, notifications, reports, audit_logs`.
Key indexes: `profiles.username unique`, `publications {owner, year}`, text index on `publications(title, abstract)` + `profiles(displayName, headline, interests)`, `messages {conversationId, createdAt}`, `connections {pair, status}` compound. Edge-model for graph (connection docs with `requester, recipient, status`) + aggregation for mutuals/degrees; no Neo4j in V1.
Alternative Postgres (recursive CTEs) rejected per user constraint; mitigate graph cost with denormalized counters (`connectionsCount`, `readsCount`).

**3. Auth.js v5 (NextAuth) Email + Google (over Clerk/Auth0/Supabase Auth).**
Self-hostable, no per-user cost, middleware-friendly. `users` holds auth; `profiles` holds public identity (1-1). Onboarding wizard writes profile. ORCID deferred as extra provider later.

**4. shadcn-strict UI (over MUI/Chakra/custom kit).**
All UI composes Button/Avatar/Badge/Card/Input/Textarea/Select/Tabs/Dialog/Sheet/DropdownMenu/Popover/Command/ScrollArea/Skeleton/Toast/Form/Table/Pagination/Tooltip/Separator. LinkedIn tokens mapped to CSS vars: `--background #F4F2EE, --card #fff, --primary #0A66C2, --border #E8E5DF`. AppShell: TopNav + LeftNav + center + RightRail desktop; bottom tabs mobile; Sheet replaces Dialog under `md`. Chart (citations sparkline) and Calendar (grants) used only where semantically real — nothing forced.

**5. Chat V1 via Pusher Channels (over raw Socket.io / Ably).**
Reason: no socket server to operate on Vercel, presence + typing events built-in, private channels per conversation (`private-conv-<id>`), Mongo remains source of truth (every event persisted first, then broadcast). Migrate to self-hosted Socket.io only if message volume/cost demands. Polling fallback if Pusher keys absent (dev).

**6. Files via S3-compatible (UploadThing/S3) — never in Mongo.**
Avatars/covers/PDFs upload direct, store URL + mime + size in docs. Validate type/size server-side; virus-scan stub hook for enterprise later.

**7. Validation + API shape.**
Zod schemas shared client/server (`lib/validators/*`); Route Handlers return `{ data | error }` envelope; `lib/api.ts` client wrapper with toast on error. React Hook Form + shadcn Form for all mutations.

**8. Feed/search V1 (over ML).**
Feed: chronological with connection boost + pinned papers; cursor pagination. Search: Mongo `$text` + autocomplete via Command palette; filters (field/institution/year/venue). Upgrade path: Atlas Search / Typesense without API change.

**9. Notifications + email.**
In-app `notifications` collection + bell Popover; Resend for welcome/request/unread digests; per-type Switch prefs. No push in V1.

## Risks / Trade-offs

- [Graph queries in Mongo get slow] → Mitigation: denormalized counters, compound indexes, cap degrees at 2-3 hops, paginate mutuals; revisit Atlas Search/graph lookup if needed.
- [Pusher cost/lock-in at scale] → Mitigation: abstract behind `lib/realtime.ts` interface; persisted history means provider swap is safe.
- ["Every shadcn component" forces awkward UX] → Mitigation: use each primitive where it fits (table), document mapping in `/design` preview; custom composites still built only from primitives.
- [LinkedIn look-alike risk] → Mitigation: inspired layout/density, distinct brand tokens + logo, no copied assets/copy.
- [PDF copyright/abuse] → Mitigation: upload limits, report flow, admin takedown + audit log, Terms stub.
- [Citation gaming / fake metrics] → Mitigation: V1 metrics are simple counters labeled as such; computed h-index deferred until provenance (Crossref) exists.
- [Vercel + Atlas cold starts] → Mitigation: connection cache, edge-safe session (JWT), ISR for public pages, skeletons everywhere.

## Migration Plan

Greenfield — no migration. Deploy order: Atlas + envs → Vercel preview → seed script (20 researchers/100 papers) → staging QA (Playwright critical paths) → prod. Rollback: Vercel instant rollback + Atlas point-in-time restore. No breaking API (version under `app/api/v1` path convention from day one).

## Open Questions

- Pusher vs Ably final vendor (pricing/region)? Default Pusher unless user objects.
- Upload vendor: UploadThing (velocity) vs raw S3 (control)?
- Username policy: free choice vs `firstname-lastname-xyz` + claim flow?
- Public-by-default vs connections-only default for new profiles?
- Email provider confirmed as Resend, or existing SMTP?

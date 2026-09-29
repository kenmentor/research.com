## 1. Foundation

- [x] 1.1 Scaffold Next.js App Router + TypeScript + ESLint + Prettier + route groups `(auth)`, `(main)`
- [x] 1.2 Set up MongoDB Atlas + Mongoose with serverless connection caching in `lib/db.ts`
- [x] 1.3 Add Zod env validation in `lib/env.ts` and shared API envelope + error handler
- [x] 1.4 Define Mongoose models + indexes: users, profiles, publications, connections, follows, posts, comments, conversations, messages, notifications, reports, audit_logs
- [x] 1.5 Add CI gate (lint + typecheck) and seed script (20 researchers / 100 papers)

## 2. Design system

- [x] 2.1 Install shadcn + Tailwind, map LinkedIn tokens (bg #F4F2EE, card #fff, primary #0A66C2, border #E8E5DF)
- [x] 2.2 Add all primitives: Button, Avatar, Badge, Card, Input, Textarea, Select, Tabs, Dialog, Sheet, DropdownMenu, Popover, Command, ScrollArea, Skeleton, Tooltip, Toast, Form, Table, Pagination, Separator, Switch, Alert, Breadcrumb
- [x] 2.3 Build AppShell: TopNav + LeftNav + center + RightRail desktop, bottom tabs mobile, PWA manifest
- [x] 2.4 Build composites from primitives only: ProfileHeader, FeedCard, MessageBubble, NetworkRow
- [x] 2.5 Add `/design` preview page + skeleton/empty/error states + dark-mode vars (light default)

## 3. Auth and onboarding

- [x] 3.1 Configure Auth.js v5 with Email + Google, session JWT, middleware protecting `(main)`
- [x] 3.2 Build login/signup pages + logout + session provider
- [x] 3.3 Build onboarding wizard (Sheet + Progress): name, affiliation, field, interests, avatar, bio
- [x] 3.4 Build account settings page (email, password, connected accounts)

## 4. Researcher profile

- [x] 4.1 Build public route `/in/[username]` with cover, avatar, headline, affiliation, verify stub
- [x] 4.2 Add action row: Connect, Message, Follow, More (DropdownMenu) with correct states
- [x] 4.3 Add sections: About, Interests badges, Experience, Education, Grants/Awards
- [x] 4.4 Add edit mode Dialogs with react-hook-form + Zod + per-section privacy Switch
- [x] 4.5 Add stats rail (connections, citations, reads, views) + completeness Progress + people-also-viewed

## 5. Publications

- [x] 5.1 Implement publication CRUD API + Zod validators (title, authors, venue, year, DOI, abstract, tags, file URL)
- [x] 5.2 Build profile Publications tab: Table/filter/Select/Pagination + pin featured
- [x] 5.3 Build detail page `/pub/[id]` with author links, reads/downloads counters, share
- [x] 5.4 Add cite tools: copy APA/MLA/BibTeX, download, share link
- [x] 5.5 Enforce PDF-as-URL-only (no raw bytes in Mongo) + upload wiring to file storage

## 6. Social graph

- [x] 6.1 Implement connections API: request/accept/decline/withdraw with denormalized counts
- [x] 6.2 Implement follows API (one-way, distinct from connects)
- [x] 6.3 Build My Network page: invitations, suggestions, connections list with mutuals
- [x] 6.4 Add block/unfollow/remove with bidirectional hiding

## 7. Feed

- [x] 7.1 Build composer Dialog: text/link/image/paper-attach with validation
- [x] 7.2 Build feed list cards with like/comment/repost/save counts + comment Sheet on mobile
- [x] 7.3 Implement V1 ranking (chronological + connection boost) with cursor pagination
- [x] 7.4 Add left mini-profile rail + right trending-papers/suggested-researchers rail

## 8. Discovery search

- [x] 8.1 Add global Command (Cmd+K) search across people/papers/posts/topics with debounce
- [x] 8.2 Add filters (field, institution, year, venue) + Mongo text indexes
- [x] 8.3 Build `/discover/people`, `/discover/papers`, `/topics/[tag]` pages

## 9. Messaging

- [x] 9.1 Implement conversations + messages APIs with pagination (`{conversationId, createdAt}` index)
- [x] 9.2 Build split-view UI: conversation list + thread pane, infinite scroll + skeletons
- [x] 9.3 Integrate Pusher (`lib/realtime.ts` abstraction): private channels, persist-then-broadcast, polling fallback
- [x] 9.4 Add sent/delivered/read states, typing indicator, presence dot, unread badges
- [x] 9.5 Add message-requests inbox for strangers + mobile full-screen thread

## 10. Notifications

- [ ] 10.1 Implement notifications collection + bell Popover with grouped Tabs + unread counts
- [ ] 10.2 Add Resend welcome/request/unread-digest emails (idempotent per event)
- [ ] 10.3 Add preferences page with per-type Switch gates + mark-read/mark-all-read

## 11. Trust, SEO, deploy

- [ ] 11.1 Add server-side upload validation (type/size) for avatars/covers/PDFs + client crop/preview
- [ ] 11.2 Add report Dialog (reason + details) + block enforcement + admin queue Table with approve/remove
- [ ] 11.3 Append every moderation action to audit_logs (admin, action, target, timestamp, reason)
- [ ] 11.4 Add SEO: SSR public pages, metadata + OG cards, sitemap.xml, robots
- [ ] 11.5 Add Sentry/Axiom logging, error boundaries, Vercel staging+prod envs, Atlas backup check
- [ ] 11.6 Add Vitest unit tests (validators, counters) + Playwright E2E (signup → profile → connect → message → publish)

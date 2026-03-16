# Roadmap: GitOps Deployments for Jira

## Milestones

- ✅ **v1.0 Marketplace Readiness** — Phases 1-4 (shipped 2026-03-12)
- ✅ **v1.1 Admin Config UX** — Phases 5-6 (shipped 2026-03-12)
- 🚧 **v1.2 Webhook Event Log** — Phases 7-9 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 Marketplace Readiness (Phases 1-4) — SHIPPED 2026-03-12</summary>

- [x] Phase 1: Site Foundation (2/2 plans) — completed 2026-03-11
- [x] Phase 2: Content Accuracy (2/2 plans) — completed 2026-03-11
- [x] Phase 3: Legal & Compliance (2/2 plans) — completed 2026-03-11
- [x] Phase 4: Marketplace Listing (1/1 plan) — completed 2026-03-12

</details>

<details>
<summary>✅ v1.1 Admin Config UX (Phases 5-6) — SHIPPED 2026-03-12</summary>

- [x] Phase 5: Admin Page & Storage Migration (2/2 plans) — completed 2026-03-12
- [x] Phase 6: Documentation Update (1/1 plan) — completed 2026-03-12

</details>

### 🚧 v1.2 Webhook Event Log (In Progress)

**Milestone Goal:** Admins can see a live event log of all webhook activity — accepted, failed, and skipped — directly in the Jira admin page.

## Phases

- [ ] **Phase 7: Event Log Backend** — SQL schema, log writes, scheduled cleanup, and manifest SQL scopes
- [ ] **Phase 8: Admin UI — Event Log Tab** — Tabbed admin page with stats strip, filterable table, and keyset pagination
- [ ] **Phase 9: Release Wrap-up** — CHANGELOG, version bump, documentation update

## Phase Details

### Phase 7: Event Log Backend
**Goal**: Every webhook invocation is durably recorded in Forge SQL and old records are automatically pruned
**Depends on**: Phase 6 (v1.1 complete)
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, MAINT-01, MAINT-02
**Success Criteria** (what must be TRUE):
  1. After a Flux or Argo webhook fires, a row appears in `webhook_events` with correct timestamp, source, status code, and available metadata
  2. The schema is created automatically on first invocation — no manual migration step required
  3. A log write failure does not change the webhook HTTP response (same status code with or without SQL available)
  4. `submitAndRespond` returns accepted/rejected/unknown counts that the handler passes to `logEvent`
  5. A scheduled trigger runs daily and deletes rows older than 30 days without affecting live traffic
**Plans:** 2 plans

Plans:
- [ ] 07-01-PLAN.md — Event log SQL module + tests
- [ ] 07-02-PLAN.md — Handler integration, manifest scopes, resolver endpoints

### Phase 8: Admin UI — Event Log Tab
**Goal**: Admins can view, filter, and paginate webhook event history from the Jira admin page
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. The admin page shows two tabs — Settings (unchanged) and Event Log — and switching between them works
  2. The Event Log tab displays a stats strip showing accepted, failed, and skipped counts for the last 24 hours
  3. Selecting Flux or Argo from the source filter updates both the stats strip and the event table
  4. The event table loads 25 rows and a "Load more" button appends the next page without a full reload
  5. Status code badges are visually distinct: 200 green, 204 grey, 4xx/5xx red
**Plans:** 1 plan

Plans:
- [ ] 08-01-PLAN.md — Tabbed layout, stats strip, filterable table, keyset pagination

### Phase 9: Release Wrap-up
**Goal**: v1.2 is documented and versioned for release
**Depends on**: Phase 8
**Requirements**: MAINT-03, HK-01, HK-02
**Success Criteria** (what must be TRUE):
  1. CHANGELOG.md exists and documents v1.0, v1.1, and v1.2 with accurate change summaries
  2. package.json reports version 1.2.0
  3. Documentation reflects the event log feature so new users can find and understand it
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Site Foundation | v1.0 | 2/2 | Complete | 2026-03-11 |
| 2. Content Accuracy | v1.0 | 2/2 | Complete | 2026-03-11 |
| 3. Legal & Compliance | v1.0 | 2/2 | Complete | 2026-03-11 |
| 4. Marketplace Listing | v1.0 | 1/1 | Complete | 2026-03-12 |
| 5. Admin Page & Storage Migration | v1.1 | 2/2 | Complete | 2026-03-12 |
| 6. Documentation Update | v1.1 | 1/1 | Complete | 2026-03-12 |
| 7. Event Log Backend | v1.2 | 0/2 | Planning | - |
| 8. Admin UI — Event Log Tab | v1.2 | 0/1 | Planning | - |
| 9. Release Wrap-up | v1.2 | 0/? | Not started | - |

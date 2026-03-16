# Requirements: GitOps Deployments for Jira

**Defined:** 2026-03-16
**Core Value:** Customers can install the app and configure their webhook secrets entirely through the Atlassian UI — no CLI access or vendor intervention required.

## v1.2 Requirements

Requirements for v1.2 Webhook Event Log milestone. Each maps to roadmap phases.

### Event Logging

- [ ] **LOG-01**: Every webhook invocation writes a summary record to Forge SQL (timestamp, source, status, release name, namespace, env, issue keys, deployment state, Jira API counts, error)
- [ ] **LOG-02**: Schema initializes lazily on first write via `CREATE TABLE IF NOT EXISTS`
- [ ] **LOG-03**: Log writes are awaited with swallowed errors — never affect webhook response
- [ ] **LOG-04**: `submitAndRespond` refactored to expose Jira API accepted/rejected/unknown counts

### Admin UI

- [ ] **UI-01**: Admin page uses tabbed layout (Settings tab + Event Log tab)
- [ ] **UI-02**: Event Log tab shows 24h stats strip (accepted, failed, skipped counts)
- [ ] **UI-03**: Event Log tab shows filterable table (source filter: All/Flux/Argo)
- [ ] **UI-04**: Table uses keyset pagination (25 rows, "Load more")
- [ ] **UI-05**: Status codes color-coded (200 green, 204 grey, 4xx/5xx red)

### Maintenance

- [ ] **MAINT-01**: Scheduled trigger deletes events older than 30 days (daily)
- [ ] **MAINT-02**: `sql:read`/`sql:write` permission scopes added to manifest
- [ ] **MAINT-03**: CHANGELOG.md created tracking v1.0, v1.1, v1.2

### Housekeeping

- [ ] **HK-01**: package.json version bumped to 1.2.0
- [ ] **HK-02**: Documentation updated for event log feature

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Admin UX

- **ADMIN-01**: Delete secret UI buttons (backend resolvers exist)
- **ADMIN-02**: Secret rotation support (dual-key window during rollover)
- **ADMIN-03**: Configurable event log retention period

### Observability

- **OBS-01**: Structured JSON logging across all handlers
- **OBS-02**: Health check endpoint for monitoring secret configuration status

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full request/response body storage | Use Forge console logs for deep debugging |
| Real-time streaming / websocket updates | Over-engineering for deployment event volume |
| Export/download event log | Not needed for v1.2 |
| Configurable retention period | 30 days fixed is sufficient |
| E2E tests | Separate effort, not bundled in this milestone |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | — | Pending |
| LOG-02 | — | Pending |
| LOG-03 | — | Pending |
| LOG-04 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| MAINT-01 | — | Pending |
| MAINT-02 | — | Pending |
| MAINT-03 | — | Pending |
| HK-01 | — | Pending |
| HK-02 | — | Pending |

**Coverage:**
- v1.2 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*

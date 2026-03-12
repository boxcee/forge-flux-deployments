# Milestones

## v1.0 Marketplace Readiness (Shipped: 2026-03-12)

**Phases:** 1-4 | **Plans:** 7

**Key accomplishments:**
- GitHub Pages documentation site with just-the-docs theme, sidebar navigation, search
- Setup guides for FluxCD and ArgoCD cross-checked against source code
- Privacy policy, terms of service, and P&S tab answers for Marketplace compliance
- Marketplace listing complete with accurate copy, live URLs, app icon

---

## v1.1 Admin Config UX (Shipped: 2026-03-12)

**Phases:** 5-6 | **Plans:** 3 | **Tasks:** 7 | **Tests:** 148 (37 new)

**Delivered:** Jira admins can configure webhook secrets through the Atlassian admin UI — no CLI access required.

**Key accomplishments:**
- KVS secret storage abstraction with env var fallback for backward compatibility
- Forge resolver with 6 validated handlers for admin page operations
- UI Kit admin page with FluxCD HMAC secret and ArgoCD bearer token forms
- Webhook handlers migrated from env vars to KVS storage with 503 not-configured guards
- Documentation rewritten to lead with admin UI configuration flow
- Marketplace listing updated to reflect self-service configuration

**Git range:** `7f3ed43..6d764b9` (19 commits, 25 files, +8,692/-177 lines)

**Tech debt:**
- `deleteFluxSecret`/`deleteArgoSecret` resolver handlers defined but no UI delete button

---


---
name: Site Formula Module
description: Backend-driven decision engine for service-site architecture blueprints
type: feature
---
- Module: OwnDev Site Formula — backend engine at owndev-backend/src/services/SiteFormula/
- JSON configs source of truth: owndev-backend/config/rules.v1.json and blueprint-template.v1.json
- API prefix: /api/v1/site-formula (registered in server.ts)
- DB tables: blueprint_sessions, blueprint_reports (migration 002)
- Frontend MUST NOT contain business logic — only collects answers and renders server payload
- P0 guardrails are immutable: one_url_one_entity, utility_always_noindex, utility_excluded_from_sitemap
- Project classes: start / growth / scale — determined by thresholds + hard triggers
- Engine is deterministic: same answers → same result
- Admin debug trace requires plan='agency'
- Iteration 1 (backend) complete. Iteration 2 (frontend) pending.

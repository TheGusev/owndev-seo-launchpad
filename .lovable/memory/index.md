# Project Memory

## Core
- Dark tech UI: cyan #3dd9c3, purple #6366f1. Use sans-serif body, Playfair Display for hero titles.
- Brand Terminology: Positon as "GEO-аудит" and "AI-ready аудит", avoid "SEO-оптимизация".
- Footer must include: 'Сделано ❤️ в России 🇷🇺'.
- Backend Stack: Node.js, Fastify, postgres.js, BullMQ, Redis. 
- Fastify authMiddleware is global via 'onRequest'. Do not add as preHandler.
- Do not store LLM keys in backend; use proxy Edge Function.
- Legacy Supabase dependencies must not be used in core API, keep Supabase ONLY for Academy.
- Do not modify Header.tsx or mobile drawer navigation.

## Memories
- [Design Aesthetic](mem://style/design-aesthetic) — Core visual style (dark tech, cyberpunk, cyan/purple accents)
- [Color Palette](mem://style/color-palette-theming) — Standardized color system for the project
- [Brand Hero Typography](mem://style/brand-hero-title-system) — Font and style rules for main headings
- [Export Report Theme](mem://style/export-report-theme) — Styling for PDF and Word reports
- [Navigation Constraints](mem://constraints/navigation-safety-rules) — Protected header and navigation elements
- [Backend Middleware Rule](mem://architecture/backend-middleware-redundancy) — Fastify authMiddleware configuration rule
- [Database Driver](mem://architecture/database-performance-strategy) — Use postgres.js instead of pg
- [Backend Stack](mem://architecture/backend-core-and-contract) — Fastify, BullMQ, Redis stack details
- [Local API Constraint](mem://architecture/backend-migration-audit-system) — No Supabase dependencies in core API layer
- [Supabase Academy Exception](mem://architecture/api-transport-strategy) — Keep Supabase client for Academy only
- [LLM Proxy Architecture](mem://architecture/llm-provider-switch) — Routing LLM requests via proxy Edge Function
- [Backend Env Config](mem://infrastructure/backend-environment-config) — Security constraints for environment variables
- [Contact Information](mem://contact/minimal-contact-info) — Official contact info and merchant details
- [pSEO Indexing Strategy](mem://seo/pseo-indexing-strategy) — Rules for indexing commercial vs utility tools
- [Production Deployment](mem://infrastructure/production-deployment-v2) — Server paths and PM2 process names
- [YooKassa Monetization](mem://features/monetization-yookassa) — Payment details for full audit
- [Domain Tracking Logic](mem://database/domain-tracking-logic) — Null user ID handling in domain creation
- [GEO Audit Terminology](mem://features/rebranding-geo-audit) — Core product positioning terminology
- [Footer Signature](mem://style/footer-heart-preference) — Copyright footer text requirement
- [Site Formula Module](mem://features/site-formula-module) — Backend decision engine for service-site blueprints

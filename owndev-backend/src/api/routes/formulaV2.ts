/**
 * Formula v2 — public API routes.
 *
 * Mounted at /api/v2/formula. v1 (/api/v1/site-formula) remains operational
 * untouched. Endpoints:
 *
 *   GET  /project-types                       — list 19 verticals (UI dropdown)
 *   POST /classify                            — infer project_type from intake
 *   GET  /page-contracts/:typeCode            — contracts for a type
 *   POST /schemas/render                      — render single JSON-LD with vars
 *   POST /build                               — generate full blueprint v2
 *   POST /preflight                           — run preflight on a blueprint
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  classifyProjectType,
  listProjectTypes,
  getProjectType,
  listPageContracts,
  renderSchema,
  buildBlueprintV2,
  runPreflight,
  PREFLIGHT_PUBLISH_THRESHOLD,
  type BuildContext,
} from '../../services/FormulaV2/index.js';
import type { ProjectTypeCode, BlueprintV2 } from '../../types/formulaV2.js';
import { logger } from '../../utils/logger.js';

const VALID_TYPE_CODES: ProjectTypeCode[] = [
  'service_geo','service_pro','service_b2b','ecommerce','marketplace',
  'saas','mobile_app','media','blog','education','medical','legal',
  'finance','realestate','hospitality','events','nonprofit','gov','portfolio',
];

// ─── Schemas ──────────────────────────────────────────────────
const intakeSchema = z.object({
  project_type_code: z.enum(VALID_TYPE_CODES as [ProjectTypeCode, ...ProjectTypeCode[]]).optional(),
  business_description: z.string().optional(),
  industry: z.string().optional(),
  has_physical_location: z.boolean().optional(),
  sells_products: z.boolean().optional(),
  has_appointments: z.boolean().optional(),
  is_marketplace: z.boolean().optional(),
  is_subscription: z.boolean().optional(),
  audience: z.enum(['b2b', 'b2c', 'mixed']).optional(),
});

const renderSchemaSchema = z.object({
  schema_type: z.string().min(1),
  variant: z.string().optional(),
  vars: z.record(z.any()),
});

const buildSchema = intakeSchema.extend({
  business_name: z.string().min(1),
  site_url: z.string().url(),
  short_description: z.string().min(1),
  long_description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  opening_hours: z.string().optional(),
  price_range: z.string().optional(),
  logo_url: z.string().url().optional(),
  social_links: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  ai_bots_policy: z.enum(['allow', 'disallow', 'mixed']).optional(),
});

// Preflight accepts a previously-built blueprint (re-validate without rebuild)
const preflightSchema = z.object({
  blueprint: z.any(), // structural validation done by runPreflight
});

export async function formulaV2Routes(app: FastifyInstance): Promise<void> {
  // ─── GET /project-types ─────────────────────────────────────
  app.get('/project-types', async (_req, reply) => {
    try {
      const types = await listProjectTypes();
      return reply.send({ types, count: types.length });
    } catch (err: any) {
      logger.error('FORMULA_V2', `list project_types failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ─── POST /classify ─────────────────────────────────────────
  app.post('/classify', async (req, reply) => {
    const parsed = intakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const result = await classifyProjectType(parsed.data);
      return reply.send(result);
    } catch (err: any) {
      logger.error('FORMULA_V2', `classify failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ─── GET /page-contracts/:typeCode ──────────────────────────
  app.get<{ Params: { typeCode: string } }>('/page-contracts/:typeCode', async (req, reply) => {
    if (!VALID_TYPE_CODES.includes(req.params.typeCode as ProjectTypeCode)) {
      return reply.code(400).send({ error: 'invalid_type_code' });
    }
    try {
      const contracts = await listPageContracts(req.params.typeCode as ProjectTypeCode);
      const projectType = await getProjectType(req.params.typeCode as ProjectTypeCode);
      return reply.send({ project_type: projectType, contracts, count: contracts.length });
    } catch (err: any) {
      logger.error('FORMULA_V2', `list page_contracts failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ─── POST /schemas/render ───────────────────────────────────
  app.post('/schemas/render', async (req, reply) => {
    const parsed = renderSchemaSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const result = await renderSchema(
        parsed.data.schema_type,
        parsed.data.vars,
        parsed.data.variant ?? 'default',
      );
      return reply.send(result);
    } catch (err: any) {
      logger.error('FORMULA_V2', `render schema failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ─── POST /build ────────────────────────────────────────────
  app.post('/build', async (req, reply) => {
    const parsed = buildSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const blueprint = await buildBlueprintV2(parsed.data as BuildContext);
      return reply.send({
        blueprint,
        publishable: blueprint.preflight.publishable,
        publish_threshold: PREFLIGHT_PUBLISH_THRESHOLD,
      });
    } catch (err: any) {
      logger.error('FORMULA_V2', `build failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ─── POST /preflight ────────────────────────────────────────
  app.post('/preflight', async (req, reply) => {
    const parsed = preflightSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const report = await runPreflight(parsed.data.blueprint as BlueprintV2);
      return reply.send({ report, publish_threshold: PREFLIGHT_PUBLISH_THRESHOLD });
    } catch (err: any) {
      logger.error('FORMULA_V2', `preflight failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });
}

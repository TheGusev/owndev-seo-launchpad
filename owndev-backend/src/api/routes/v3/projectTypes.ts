/**
 * V3 project types — GET /api/v3/project-types
 *
 * Returns all 23 project types (Tier A: 10, Tier B: 1, Tier C: 12) with tier
 * classification and engine_modules from formula_project_types.
 */
import type { FastifyInstance } from 'fastify';
import { sql } from '../../../db/client.js';

interface ProjectTypeRow {
  code: string;
  name_ru: string;
  name_en: string;
  group_code: string | null;
  description: string | null;
  default_intents: string[];
  default_layers: string[];
  required_schemas: string[];
  is_active: boolean;
  sort_order: number;
  tier: string | null;
  engine_modules: string[] | null;
  pack_template: string | null;
}

export async function projectTypesV3Routes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    try {
      const rows = await sql<ProjectTypeRow[]>`
        SELECT
          code, name_ru, name_en, group_code, description,
          default_intents, default_layers, required_schemas,
          is_active, sort_order, tier, engine_modules, pack_template
        FROM formula_project_types
        WHERE is_active = TRUE
        ORDER BY tier NULLS LAST, sort_order ASC, code ASC
      `;
      reply.send({
        success: true,
        total: rows.length,
        by_tier: {
          A: rows.filter((r) => r.tier === 'A').length,
          B: rows.filter((r) => r.tier === 'B').length,
          C: rows.filter((r) => r.tier === 'C').length,
        },
        types: rows,
      });
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.get('/:code', async (req, reply) => {
    const { code } = req.params as { code: string };
    const rows = await sql<ProjectTypeRow[]>`
      SELECT
        code, name_ru, name_en, group_code, description,
        default_intents, default_layers, required_schemas,
        is_active, sort_order, tier, engine_modules, pack_template
      FROM formula_project_types
      WHERE code = ${code} AND is_active = TRUE
      LIMIT 1
    `;
    if (rows.length === 0) {
      reply.status(404).send({ success: false, error: `Project type ${code} not found` });
      return;
    }
    reply.send({ success: true, type: rows[0] });
  });
}

/**
 * V3 schema registry — schema graph builder.
 *
 *   POST /api/v3/schema/build   — build a JSON-LD @graph for given inputs
 *   GET  /api/v3/schema/recipes — list all available recipes
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  buildGraph,
  validateGraph,
  listPageTypes,
  getRecipe,
  RECIPES,
} from '../../../services/schemaRegistry/index.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';

const buildSchema = z.object({
  project_code: z.string().min(1),
  page_type: z.string().min(1),
  page_url: z.string().url(),
  page_name: z.string().min(1),
  page_description: z.string().min(1),
  schema_ctx: z.object({
    brand_name: z.string().min(1),
    legal_name: z.string().optional(),
    url: z.string().url(),
    logo_url: z.string().url().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      region: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).passthrough(),
  service_ctx: z.any().optional(),
  product_ctx: z.any().optional(),
  faq_items: z.array(z.any()).optional(),
  breadcrumb_items: z.array(z.any()).optional(),
  article_ctx: z.any().optional(),
  person_ctx: z.any().optional(),
  event_ctx: z.any().optional(),
});

export async function schemaRegistryV3Routes(app: FastifyInstance) {
  app.post('/build', async (req, reply) => {
    const parsed = buildSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.status(400).send({ success: false, error: 'Invalid input', issues: parsed.error.issues });
      return;
    }
    try {
      const result = buildGraph(parsed.data as any);
      const validation = validateGraph(result.graph);
      reply.send({ success: true, ...result, validation });
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.get('/recipes', async (_req, reply) => {
    const codes = Object.keys(RECIPES);
    reply.send({
      success: true,
      total: codes.length,
      recipes: codes.map((c) => ({
        project_code: c,
        page_types: listPageTypes(c as ProjectTypeCodeV3),
      })),
    });
  });

  app.get('/recipes/:projectCode/:pageType', async (req, reply) => {
    const { projectCode, pageType } = req.params as { projectCode: string; pageType: string };
    const recipe = getRecipe(projectCode as ProjectTypeCodeV3, pageType);
    if (!recipe) {
      reply.status(404).send({ success: false, error: `No recipe for ${projectCode}/${pageType}` });
      return;
    }
    reply.send({ success: true, recipe });
  });
}

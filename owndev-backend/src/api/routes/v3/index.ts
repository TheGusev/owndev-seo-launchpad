/**
 * V3 API — Fastify route plugin.
 *
 * Mounted at /api/v3 — exposes:
 *   GET  /api/v3/project-types
 *   GET  /api/v3/project-types/:code
 *   GET  /api/v3/page-contracts/:projectCode
 *   POST /api/v3/schema/build
 *   GET  /api/v3/schema/recipes
 *   GET  /api/v3/schema/recipes/:projectCode/:pageType
 *   POST /api/v3/pipeline/run
 *   GET  /api/v3/pipeline/result/:job_id
 *   GET  /api/v3/pack/:job_id          (JSON)
 *   GET  /api/v3/pack/:job_id.zip       (ZIP)
 *   POST /api/v3/pack/export
 *   GET  /api/v3/pack/:job_id/validate
 */
import type { FastifyInstance } from 'fastify';
import { pipelineRoutes } from './pipeline.js';
import { projectTypesV3Routes } from './projectTypes.js';
import { pageContractsV3Routes } from './pageContracts.js';
import { schemaRegistryV3Routes } from './schemaRegistry.js';
import { packV3Routes } from './pack.js';
import { directExportRoutes } from './directExport.js';

export async function v3Routes(app: FastifyInstance) {
  await app.register(pipelineRoutes, { prefix: '/pipeline' });
  await app.register(projectTypesV3Routes, { prefix: '/project-types' });
  await app.register(pageContractsV3Routes, { prefix: '/page-contracts' });
  await app.register(schemaRegistryV3Routes, { prefix: '/schema' });
  await app.register(packV3Routes, { prefix: '/pack' });
  await app.register(directExportRoutes, { prefix: '/direct-export' });
}

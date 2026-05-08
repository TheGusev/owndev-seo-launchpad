/**
 * V3 page contracts — GET /api/v3/page-contracts/:projectCode
 *
 * Returns the 38+ page contracts for a project type (V3 schema with
 * H1/Title/intro/FAQ/commercial signals).
 */
import type { FastifyInstance } from 'fastify';
import { listV3Contracts } from '../../../services/pageContracts/repository.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';

const VALID_CODES = new Set<ProjectTypeCodeV3>([
  'service_geo', 'service_pro', 'service_b2b', 'ecommerce', 'marketplace',
  'saas', 'education', 'medical', 'legal', 'realestate',
  'mobile_app',
  'finance', 'hospitality', 'events', 'nonprofit', 'gov', 'portfolio',
  'media', 'blog',
  'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
  // PR-10/11: подкатегории локальных услуг
  'service_pest_control', 'service_repair_home', 'service_auto', 'service_beauty',
]);

export async function pageContractsV3Routes(app: FastifyInstance) {
  app.get('/:projectCode', async (req, reply) => {
    const { projectCode } = req.params as { projectCode: string };
    if (!VALID_CODES.has(projectCode as ProjectTypeCodeV3)) {
      reply.status(400).send({ success: false, error: `Unknown project_code: ${projectCode}` });
      return;
    }
    try {
      const contracts = await listV3Contracts(projectCode as ProjectTypeCodeV3);
      reply.send({
        success: true,
        project_code: projectCode,
        total: contracts.length,
        contracts,
      });
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  });
}

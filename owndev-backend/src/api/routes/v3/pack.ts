/**
 * V3 pack endpoints.
 *
 *   GET /api/v3/pack/:job_id        — JSON pack from latest pipeline run
 *   GET /api/v3/pack/:job_id.zip    — ZIP bundle
 *   POST /api/v3/pack/export        — re-export an existing pack with a new mode/platform
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { developerPackService } from '../../../services/developerPack/index.js';
import { loadLatestPack } from '../../../services/developerPack/repository.js';
import { getCachedPipelineResult } from './pipeline.js';

const exportSchema = z.object({
  job_id: z.string().min(1).optional(),
  pack: z.any().optional(),       // raw SuperPromptPack object
  mode: z.enum(['structured', 'full', 'platform_specific']).optional(),
  platform: z.enum(['lovable', 'cursor', 'v0', 'claude_code', 'raw']).optional(),
});

export async function packV3Routes(app: FastifyInstance) {
  // GET /pack/:job_id (handle .zip suffix as well)
  app.get('/:job_id', async (req, reply) => {
    let { job_id } = req.params as { job_id: string };
    const wantsZip = job_id.endsWith('.zip');
    if (wantsZip) job_id = job_id.replace(/\.zip$/, '');

    let pack: any = null;
    const cached = getCachedPipelineResult(job_id);
    if (cached?.pack) {
      pack = cached.pack;
    } else {
      try {
        pack = await loadLatestPack(job_id);
      } catch {
        pack = null;
      }
    }
    if (!pack) {
      reply.status(404).send({ success: false, error: 'Pack not found for this job_id' });
      return;
    }

    if (wantsZip) {
      const bundle = await developerPackService.exportPack(
        pack,
        pack.export_mode ?? 'structured',
        pack.platform_target,
      );
      if (!bundle.zip_buffer) {
        reply.status(500).send({ success: false, error: 'ZIP not produced for this mode' });
        return;
      }
      reply
        .header('Content-Type', 'application/zip')
        .header('Content-Disposition', `attachment; filename="owndev-pack-${job_id}.zip"`)
        .send(bundle.zip_buffer);
      return;
    }

    reply.send({ success: true, pack });
  });

  app.post('/export', async (req, reply) => {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.status(400).send({ success: false, error: 'Invalid input', issues: parsed.error.issues });
      return;
    }
    let pack = parsed.data.pack;
    if (!pack && parsed.data.job_id) {
      const cached = getCachedPipelineResult(parsed.data.job_id);
      pack = cached?.pack ?? (await loadLatestPack(parsed.data.job_id).catch(() => null));
    }
    if (!pack) {
      reply.status(404).send({ success: false, error: 'No pack provided and none cached for job_id' });
      return;
    }
    try {
      const bundle = await developerPackService.exportPack(
        pack,
        parsed.data.mode ?? 'structured',
        parsed.data.platform,
      );
      reply.send({
        success: true,
        mode: bundle.mode,
        platform: bundle.platform,
        artifact_count: bundle.artifacts.length,
        artifacts: bundle.artifacts.map((a) => ({
          filename: a.filename,
          content_type: a.content_type,
          size: a.content.length,
        })),
        zip_size: bundle.zip_buffer?.length,
      });
    } catch (err: any) {
      reply.status(500).send({ success: false, error: err.message });
    }
  });

  app.get('/:job_id/validate', async (req, reply) => {
    const { job_id } = req.params as { job_id: string };
    const cached = getCachedPipelineResult(job_id);
    const pack = cached?.pack ?? (await loadLatestPack(job_id).catch(() => null));
    if (!pack) {
      reply.status(404).send({ success: false, error: 'Pack not found' });
      return;
    }
    const result = developerPackService.validate(pack);
    reply.send({ success: true, validation: result });
  });
}

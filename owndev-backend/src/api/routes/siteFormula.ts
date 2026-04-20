import type { FastifyInstance } from 'fastify';
import { sql } from '../../db/client.js';
import { randomUUID } from 'crypto';
import { runEngine, getConfigVersions, loadRules } from '../../services/SiteFormula/index.js';
import { ValidationError, RuntimeError } from '../../services/SiteFormula/runtimeValidator.js';
import { logger } from '../../utils/logger.js';
import type { RequestUser } from '../middleware/auth.js';

export async function siteFormulaRoutes(app: FastifyInstance): Promise<void> {

  // Ensure tables exist (non-blocking — never crash plugin registration on DB hiccups).
  // Run async after registration; if DB is temporarily unavailable, individual endpoints will surface errors.
  void (async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS blueprint_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          raw_answers JSONB,
          engine_state JSONB,
          preview_payload JSONB,
          full_report_payload JSONB,
          rules_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
          template_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS blueprint_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID NOT NULL REFERENCES blueprint_sessions(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'locked',
          unlock_token VARCHAR(64),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      logger.info('SITE_FORMULA', 'Tables blueprint_sessions / blueprint_reports ensured');
    } catch (err: any) {
      logger.error('SITE_FORMULA', `Table ensure failed (non-fatal): ${err.message}`);
    }
  })();

  // ─── POST /sessions — create session ───
  app.post('/sessions', async (_req, reply) => {
    const id = randomUUID();
    const versions = getConfigVersions();
    await sql`
      INSERT INTO blueprint_sessions (id, status, rules_version, template_version)
      VALUES (${id}, 'draft', ${versions.rules_version}, ${versions.template_version})
    `;
    logger.info('SITE_FORMULA', `Session created: ${id}`);
    return reply.send({ session_id: id, status: 'draft' });
  });

  // ─── POST /sessions/:id/answers — save answers ───
  app.post<{ Params: { id: string }; Body: { answers: Record<string, any> } }>(
    '/sessions/:id/answers',
    async (req, reply) => {
      const { id } = req.params;
      const { answers } = req.body as any;

      if (!answers || typeof answers !== 'object') {
        return reply.status(400).send({ success: false, error: 'answers object required' });
      }

      // Check session exists
      const [session] = await sql<any[]>`SELECT status FROM blueprint_sessions WHERE id = ${id}`;
      if (!session) {
        return reply.status(404).send({ success: false, error: 'Session not found' });
      }

      await sql`
        UPDATE blueprint_sessions
        SET raw_answers = ${sql.json(answers)},
            status = 'answers_saved',
            updated_at = NOW()
        WHERE id = ${id}
      `;

      return reply.send({ success: true, status: 'answers_saved' });
    }
  );

  // ─── POST /sessions/:id/run — execute engine ───
  app.post<{ Params: { id: string } }>(
    '/sessions/:id/run',
    async (req, reply) => {
      const { id } = req.params;

      const [session] = await sql<any[]>`
        SELECT id, status, raw_answers FROM blueprint_sessions WHERE id = ${id}
      `;
      if (!session) {
        return reply.status(404).send({ success: false, error: 'Session not found' });
      }

      if (
        !session.raw_answers ||
        typeof session.raw_answers !== 'object' ||
        Array.isArray(session.raw_answers) ||
        Object.keys(session.raw_answers).length === 0
      ) {
        return reply
          .status(400)
          .send({ success: false, error: 'Сохраните ответы перед запуском', code: 'NO_ANSWERS' });
      }

      // Idempotent: if already run and preview_ready, return existing
      if (session.status === 'preview_ready' || session.status === 'unlocked') {
        const [existing] = await sql<any[]>`
          SELECT preview_payload FROM blueprint_sessions WHERE id = ${id}
        `;
        return reply.send({
          success: true,
          status: session.status,
          preview_payload: existing?.preview_payload,
        });
      }

      // Prevent concurrent runs
      await sql`
        UPDATE blueprint_sessions SET status = 'running', updated_at = NOW() WHERE id = ${id}
      `;

      try {
        const result = runEngine(session.raw_answers);

        await sql`
          UPDATE blueprint_sessions
          SET engine_state = ${sql.json(result.engine_state as any)},
              preview_payload = ${sql.json(result.preview_payload as any)},
              full_report_payload = ${sql.json(result.full_report_payload as any)},
              status = 'preview_ready',
              rules_version = ${result.full_report_payload.metadata.rules_version},
              template_version = ${result.full_report_payload.metadata.template_version},
              updated_at = NOW()
          WHERE id = ${id}
        `;

        // Create locked report
        const reportId = randomUUID();
        await sql`
          INSERT INTO blueprint_reports (id, session_id, status)
          VALUES (${reportId}, ${id}, 'locked')
        `;

        logger.info('SITE_FORMULA', `Engine run complete for session ${id}: class=${result.engine_state.project_class}`);

        return reply.send({
          success: true,
          status: 'preview_ready',
          preview_payload: result.preview_payload,
        });
      } catch (err: any) {
        const errorMsg = err instanceof ValidationError || err instanceof RuntimeError
          ? err.message
          : 'Internal engine error';

        await sql`
          UPDATE blueprint_sessions SET status = 'error', updated_at = NOW() WHERE id = ${id}
        `;

        logger.error('SITE_FORMULA', `Engine error for session ${id}: ${err.message}`);
        return reply.status(500).send({ success: false, error: errorMsg, code: 'ENGINE_ERROR' });
      }
    }
  );

  // ─── POST /sessions/:id/unlock — unlock full report ───
  app.post<{ Params: { id: string } }>(
    '/sessions/:id/unlock',
    async (req, reply) => {
      const { id } = req.params;

      const [session] = await sql<any[]>`
        SELECT status, full_report_payload FROM blueprint_sessions WHERE id = ${id}
      `;
      if (!session) {
        return reply.status(404).send({ success: false, error: 'Session not found' });
      }

      // Already unlocked — idempotent
      if (session.status === 'unlocked') {
        return reply.send({
          success: true,
          status: 'unlocked',
          full_report_payload: session.full_report_payload,
        });
      }

      if (session.status !== 'preview_ready') {
        return reply.status(400).send({
          success: false,
          error: 'Engine must be run first',
        });
      }

      // TODO: payment verification goes here in production
      const unlockToken = randomUUID().replace(/-/g, '');

      await sql`
        UPDATE blueprint_sessions SET status = 'unlocked', updated_at = NOW() WHERE id = ${id}
      `;
      await sql`
        UPDATE blueprint_reports
        SET status = 'unlocked', unlock_token = ${unlockToken}
        WHERE session_id = ${id}
      `;

      logger.info('SITE_FORMULA', `Session ${id} unlocked`);

      return reply.send({
        success: true,
        status: 'unlocked',
        full_report_payload: session.full_report_payload,
        unlock_token: unlockToken,
      });
    }
  );

  // ─── GET /sessions/:id — get session with payloads ───
  app.get<{ Params: { id: string } }>(
    '/sessions/:id',
    async (req, reply) => {
      const { id } = req.params;

      const [session] = await sql<any[]>`
        SELECT id, status, raw_answers, preview_payload, full_report_payload,
               rules_version, template_version, created_at, updated_at
        FROM blueprint_sessions WHERE id = ${id}
      `;
      if (!session) {
        return reply.status(404).send({ success: false, error: 'Session not found' });
      }

      // Only return full_report_payload if unlocked
      const response: any = {
        id: session.id,
        status: session.status,
        raw_answers: session.raw_answers,
        preview_payload: session.preview_payload,
        rules_version: session.rules_version,
        template_version: session.template_version,
        created_at: session.created_at,
        updated_at: session.updated_at,
      };

      if (session.status === 'unlocked') {
        response.full_report_payload = session.full_report_payload;
      }

      return reply.send(response);
    }
  );

  // ─── GET /sessions/:id/debug-trace — admin-only debug ───
  app.get<{ Params: { id: string } }>(
    '/sessions/:id/debug-trace',
    async (req, reply) => {
      const user = (req as any).user as RequestUser;
      if (!user || user.plan !== 'agency') {
        return reply.status(403).send({ success: false, error: 'Admin access required' });
      }

      const { id } = req.params;
      const [session] = await sql<any[]>`
        SELECT engine_state, preview_payload, full_report_payload,
               rules_version, template_version
        FROM blueprint_sessions WHERE id = ${id}
      `;
      if (!session) {
        return reply.status(404).send({ success: false, error: 'Session not found' });
      }

      return reply.send({
        engine_state: session.engine_state,
        preview_payload: session.preview_payload,
        full_report_payload: session.full_report_payload,
        rules_version: session.rules_version,
        template_version: session.template_version,
      });
    }
  );

  // ─── GET /config-version — current config versions ───
  app.get('/config-version', async (_req, reply) => {
    const versions = getConfigVersions();
    return reply.send(versions);
  });

  // ─── GET /questions — wizard questions from config ───
  app.get('/questions', async (_req, reply) => {
    const rules = loadRules();
    return reply.send({
      questions: rules.questions,
      total_steps: Math.max(...rules.questions.map((q) => q.step)),
    });
  });
}

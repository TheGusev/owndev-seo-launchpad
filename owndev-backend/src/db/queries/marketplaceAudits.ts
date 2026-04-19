import { sql } from '../client.js';
import type {
  MarketplaceAuditRow,
  MarketplacePlatform,
  MarketplaceInputType,
  MarketplaceAuditStatus,
} from '../../types/marketplaceAudit.js';

export async function createMarketplaceAudit(
  id: string,
  platform: MarketplacePlatform,
  inputType: MarketplaceInputType,
  value: string,
  manual?: Record<string, any>,
): Promise<void> {
  await sql`
    INSERT INTO marketplace_audits
      (id, source_platform, input_type, input_value, status, progress_pct, attributes_json)
    VALUES
      (${id}, ${platform}, ${inputType}, ${value}, 'pending', 0, ${sql.json(manual ?? {})})
  `;
}

export async function getMarketplaceAudit(id: string): Promise<MarketplaceAuditRow | null> {
  const rows = await sql<MarketplaceAuditRow[]>`
    SELECT * FROM marketplace_audits WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function updateAuditProgress(
  id: string,
  status: MarketplaceAuditStatus,
  progressPct: number,
): Promise<void> {
  await sql`
    UPDATE marketplace_audits
    SET status = ${status}, progress_pct = ${progressPct}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function saveAuditResult(
  id: string,
  data: {
    product_title: string;
    product_description: string;
    category: string;
    attributes_json: Record<string, string>;
    images_json: string[];
    scores_json: any;
    issues_json: any[];
    keywords_json: any;
    competitors_json: any;
    recommendations_json: any;
    ai_summary: string;
  },
): Promise<void> {
  await sql`
    UPDATE marketplace_audits
    SET status = 'done',
        progress_pct = 100,
        product_title = ${data.product_title},
        product_description = ${data.product_description},
        category = ${data.category},
        attributes_json = ${sql.json(data.attributes_json)},
        images_json = ${sql.json(data.images_json)},
        scores_json = ${sql.json(data.scores_json)},
        issues_json = ${sql.json(data.issues_json)},
        keywords_json = ${sql.json(data.keywords_json)},
        competitors_json = ${sql.json(data.competitors_json)},
        recommendations_json = ${sql.json(data.recommendations_json)},
        ai_summary = ${data.ai_summary},
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function failAudit(id: string, message: string): Promise<void> {
  await sql`
    UPDATE marketplace_audits
    SET status = 'error', error_msg = ${message}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

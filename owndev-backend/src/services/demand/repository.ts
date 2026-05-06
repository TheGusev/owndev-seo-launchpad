/**
 * services/demand — repository.
 *
 * Persists DemandIntelligenceResult to demand_clusters and
 * demand_geo_distribution.
 */
import { sql } from '../../db/client.js';
import type {
  DemandClusterV3,
  DemandGeoDistributionV3,
  DemandIntelligenceResult,
} from './types.js';

export async function saveClusters(
  sessionId: string,
  clusters: DemandClusterV3[],
): Promise<DemandClusterV3[]> {
  const saved: DemandClusterV3[] = [];
  for (const c of clusters) {
    const rows = await sql<Array<{ id: string }>>`
      INSERT INTO demand_clusters (
        session_id, cluster_label, intent, seed_keyword, region_code,
        keywords, total_frequency, recommended_page_type, recommended_url_pattern,
        recommended_h1_template, recommended_title_template, recommended_faq_questions
      )
      VALUES (
        ${sessionId}, ${c.cluster_label}, ${c.intent}, ${c.seed_keyword}, ${c.region_code},
        ${sql.json(c.keywords as any)}, ${c.total_frequency},
        ${c.recommended_page_type}, ${c.recommended_url_pattern},
        ${c.recommended_h1_template ?? null}, ${c.recommended_title_template ?? null},
        ${sql.json((c.recommended_faq_questions ?? []) as any)}
      )
      RETURNING id
    `;
    saved.push({ ...c, id: rows[0].id });
  }
  return saved;
}

export async function saveGeoDistribution(
  sessionId: string,
  clusterId: string | null,
  distribution: DemandGeoDistributionV3[],
): Promise<void> {
  for (const d of distribution) {
    await sql`
      INSERT INTO demand_geo_distribution (
        session_id, cluster_id, region_code, region_name_ru,
        affinity_index, absolute_frequency, is_recommended_geo
      )
      VALUES (
        ${sessionId}, ${clusterId}, ${d.region_code}, ${d.region_name_ru},
        ${d.affinity_index}, ${d.absolute_frequency}, ${d.is_recommended_geo}
      )
      ON CONFLICT (session_id, cluster_id, region_code) DO UPDATE SET
        region_name_ru     = EXCLUDED.region_name_ru,
        affinity_index     = EXCLUDED.affinity_index,
        absolute_frequency = EXCLUDED.absolute_frequency,
        is_recommended_geo = EXCLUDED.is_recommended_geo,
        fetched_at         = NOW()
    `;
  }
}

export async function loadResultBySession(
  sessionId: string,
): Promise<DemandIntelligenceResult | null> {
  const clusters = await sql<Array<{
    id: string;
    cluster_label: string;
    intent: string;
    seed_keyword: string;
    region_code: string;
    keywords: any;
    total_frequency: number;
    recommended_page_type: string | null;
    recommended_url_pattern: string | null;
    recommended_h1_template: string | null;
    recommended_title_template: string | null;
    recommended_faq_questions: any;
  }>>`
    SELECT id, cluster_label, intent, seed_keyword, region_code,
           keywords, total_frequency,
           recommended_page_type, recommended_url_pattern,
           recommended_h1_template, recommended_title_template,
           recommended_faq_questions
    FROM demand_clusters
    WHERE session_id = ${sessionId}
    ORDER BY total_frequency DESC
  `;

  if (clusters.length === 0) return null;

  const geo = await sql<Array<{
    region_code: string;
    region_name_ru: string;
    affinity_index: string;
    absolute_frequency: number;
    is_recommended_geo: boolean;
  }>>`
    SELECT region_code, region_name_ru, affinity_index::text,
           absolute_frequency, is_recommended_geo
    FROM demand_geo_distribution
    WHERE session_id = ${sessionId} AND cluster_id IS NULL
    ORDER BY affinity_index DESC
  `;

  const seedKeywords = Array.from(new Set(clusters.map((c) => c.seed_keyword)));
  const totalVolume = clusters.reduce((s, c) => s + Number(c.total_frequency), 0);

  return {
    session_id: sessionId,
    seed_keywords: seedKeywords,
    clusters: clusters.map((c) => ({
      id: c.id,
      session_id: sessionId,
      cluster_label: c.cluster_label,
      intent: c.intent as any,
      seed_keyword: c.seed_keyword,
      region_code: c.region_code,
      keywords: c.keywords ?? [],
      total_frequency: Number(c.total_frequency),
      recommended_page_type: c.recommended_page_type ?? '',
      recommended_url_pattern: c.recommended_url_pattern ?? '',
      recommended_h1_template: c.recommended_h1_template ?? undefined,
      recommended_title_template: c.recommended_title_template ?? undefined,
      recommended_faq_questions: c.recommended_faq_questions ?? [],
    })),
    geo_distribution: geo.map((g) => ({
      region_code: g.region_code,
      region_name_ru: g.region_name_ru,
      affinity_index: Number(g.affinity_index),
      absolute_frequency: g.absolute_frequency,
      is_recommended_geo: g.is_recommended_geo,
    })),
    recommended_geos: geo.filter((g) => g.is_recommended_geo).map((g) => g.region_code),
    total_volume: totalVolume,
    quota_used: 0,
    generated_at: new Date().toISOString(),
  };
}

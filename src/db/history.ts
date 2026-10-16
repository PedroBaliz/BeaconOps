
import { pool } from "./pool.js";
import type { CheckResult } from "../core/checker.js";
import type { AnalysisResult } from "../core/analyzer.js";

export async function saveAnalysis(
  result: CheckResult,
  analysis: AnalysisResult
): Promise<void> {
  const query = `
    INSERT INTO analysis_history (
      url,
      status_code,
      latency_ms,
      is_online,
      error,
      analysis_status,
      summary,
      recommendations,
      checked_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
  `;

  const values = [
    result.url,
    result.statusCode,
    result.latencyMs,
    result.isOnline,
    result.error,
    analysis.status,
    analysis.summary,
    JSON.stringify(analysis.recommendations),
    result.checkedAt,
  ];

  await pool.query(query, values);
}

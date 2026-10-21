
import { pool } from "./pool.js";

export interface MonitoredService {
  id: number;
  name: string;
  url: string;
  intervalSeconds: number;
  isActive: boolean;
  createdAt: Date;
  nextCheckAt: Date;
  lastStatus: "UP" | "DEGRADED" | "DOWN" | null;
  lastLatencyMs: number | null;
  lastCheckedAt: Date | null;
}

export async function createMonitoredService(
  name: string,
  url: string,
  intervalSeconds: number
): Promise<MonitoredService> {
  const query = `
    INSERT INTO monitored_services (
      name,
      url,
      interval_seconds,
      next_check_at
    )
    VALUES ($1, $2, $3, NOW())
    RETURNING
      id,
      name,
      url,
      interval_seconds AS "intervalSeconds",
      is_active AS "isActive",
      created_at AS "createdAt",
      next_check_at AS "nextCheckAt",
      NULL::text AS "lastStatus",
      NULL::integer AS "lastLatencyMs",
      NULL::timestamptz AS "lastCheckedAt"
  `;

  const result = await pool.query<MonitoredService>(query, [
    name,
    url,
    intervalSeconds,
  ]);

  return result.rows[0];
}

export async function getMonitoredServices(): Promise<MonitoredService[]> {
  const query = `
    SELECT
      m.id,
      m.name,
      m.url,
      m.interval_seconds AS "intervalSeconds",
      m.is_active AS "isActive",
      m.created_at AS "createdAt",
      m.next_check_at AS "nextCheckAt",
      latest.analysis_status AS "lastStatus",
      latest.latency_ms AS "lastLatencyMs",
      latest.checked_at AS "lastCheckedAt"
    FROM monitored_services m
    LEFT JOIN LATERAL (
      SELECT
        h.analysis_status,
        h.latency_ms,
        h.checked_at
      FROM analysis_history h
      WHERE h.url = m.url
      ORDER BY h.checked_at DESC
      LIMIT 1
    ) latest ON TRUE
    ORDER BY m.id DESC
  `;

  const result = await pool.query<MonitoredService>(query);

  return result.rows;
}

export async function getMonitoredServiceById(
  id: number
): Promise<MonitoredService | null> {
  const query = `
    SELECT
      m.id,
      m.name,
      m.url,
      m.interval_seconds AS "intervalSeconds",
      m.is_active AS "isActive",
      m.created_at AS "createdAt",
      m.next_check_at AS "nextCheckAt",
      latest.analysis_status AS "lastStatus",
      latest.latency_ms AS "lastLatencyMs",
      latest.checked_at AS "lastCheckedAt"
    FROM monitored_services m
    LEFT JOIN LATERAL (
      SELECT
        h.analysis_status,
        h.latency_ms,
        h.checked_at
      FROM analysis_history h
      WHERE h.url = m.url
      ORDER BY h.checked_at DESC
      LIMIT 1
    ) latest ON TRUE
    WHERE m.id = $1
  `;

  const result = await pool.query<MonitoredService>(query, [id]);

  return result.rows[0] ?? null;
}

export async function updateMonitoredServiceInterval(
  id: number,
  intervalSeconds: number
): Promise<boolean> {
  const query = `
    UPDATE monitored_services
    SET
      interval_seconds = $2,
      next_check_at = NOW() + ($2 * INTERVAL '1 second')
    WHERE id = $1
    RETURNING id
  `;

  const result = await pool.query(query, [id, intervalSeconds]);

  return result.rowCount === 1;
}

export async function getDueMonitoredServices(): Promise<MonitoredService[]> {
  const query = `
    SELECT
      id,
      name,
      url,
      interval_seconds AS "intervalSeconds",
      is_active AS "isActive",
      created_at AS "createdAt",
      next_check_at AS "nextCheckAt",
      NULL::text AS "lastStatus",
      NULL::integer AS "lastLatencyMs",
      NULL::timestamptz AS "lastCheckedAt"
    FROM monitored_services
    WHERE is_active = TRUE
      AND next_check_at <= NOW()
    ORDER BY next_check_at ASC
  `;

  const result = await pool.query<MonitoredService>(query);

  return result.rows;
}

export async function scheduleNextCheck(
  id: number,
  intervalSeconds: number
): Promise<void> {
  await pool.query(
    `UPDATE monitored_services
     SET next_check_at = NOW() + ($2 * INTERVAL '1 second')
     WHERE id = $1`,
    [id, intervalSeconds]
  );
}


import { pool } from "./pool.js";

export interface MonitoredService {
  id: number;
  name: string;
  url: string;
  intervalSeconds: number;
  isActive: boolean;
  createdAt: Date;
  nextCheckAt: Date;
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
      next_check_at AS "nextCheckAt"
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
      id,
      name,
      url,
      interval_seconds AS "intervalSeconds",
      is_active AS "isActive",
      created_at AS "createdAt",
      next_check_at AS "nextCheckAt"
    FROM monitored_services
    ORDER BY id DESC
  `;

  const result = await pool.query<MonitoredService>(query);

  return result.rows;
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
      next_check_at AS "nextCheckAt"
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

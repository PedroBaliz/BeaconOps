
import { pool } from "./pool.js";

export interface MonitoredService {
  id: number;
  name: string;
  url: string;
  intervalSeconds: number;
  isActive: boolean;
  createdAt: Date;
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
      interval_seconds
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      name,
      url,
      interval_seconds AS "intervalSeconds",
      is_active AS "isActive",
      created_at AS "createdAt"
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
      created_at AS "createdAt"
    FROM monitored_services
    ORDER BY id DESC
  `;

  const result = await pool.query<MonitoredService>(query);

  return result.rows;
}

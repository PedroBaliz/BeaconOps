
export interface CheckResult {
  url: string;
  statusCode: number | null;
  latencyMs: number | null;
  isOnline: boolean;
  error: string | null;
  checkedAt: string;
}

export type ServiceStatus = "UP" | "DEGRADED" | "DOWN";

export interface AnalysisResult {
  status: ServiceStatus;
  summary: string;
  recommendations: string[];
}

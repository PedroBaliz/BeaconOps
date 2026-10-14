import type { CheckResult } from "./checker.js";

export interface AnalysisResult {
  status: "UP" | "DEGRADED" | "DOWN";
  summary: string;
  recommendations: string[];
}

export function analyzeResult(
  result: CheckResult
): AnalysisResult {
  if (!result.isOnline) {
    return {
      status: "DOWN",
      summary:
        result.error ??
        "O serviço não respondeu com um status HTTP de sucesso.",
      recommendations: [
        "Verifique se o serviço está disponível.",
        "Confira a URL e a configuração do servidor.",
        "Investigue os logs do serviço se o problema persistir.",
      ],
    };
  }

  if (result.latencyMs >= 2000) {
    return {
      status: "DEGRADED",
      summary:
        "O serviço respondeu, mas apresentou latência elevada.",
      recommendations: [
        "Verifique a carga do servidor.",
        "Investigue consultas lentas e dependências externas.",
        "Repita o teste para confirmar se a lentidão persiste.",
      ],
    };
  }

  return {
    status: "UP",
    summary:
      "O serviço respondeu com sucesso e apresentou latência aceitável.",
    recommendations: [
      "Nenhuma ação imediata é necessária.",
      "Repita o teste se quiser confirmar a estabilidade.",
    ],
  };
}
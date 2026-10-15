
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
        "Não foi possível estabelecer comunicação com o servidor.",
      recommendations: [
        "Verifique se o domínio está correto e acessível.",
        "Confira a disponibilidade do servidor e a conexão de rede.",
        "Investigue o timeout, o DNS ou os logs do serviço.",
      ],
    };
  }

  const statusCode = result.statusCode;

  if (statusCode !== null && statusCode >= 500) {
    return {
      status: "DEGRADED",
      summary:
        `O servidor está acessível, mas retornou HTTP ${statusCode}, indicando um possível erro interno.`,
      recommendations: [
        "Verifique os logs e a aplicação no servidor.",
        "Investigue bancos de dados e dependências externas.",
        "Repita a análise para confirmar se o erro persiste.",
      ],
    };
  }

  if (statusCode !== null && statusCode >= 400) {
    return {
      status: "DEGRADED",
      summary:
        `O servidor está acessível, mas retornou HTTP ${statusCode}. O recurso pode não existir ou a solicitação pode exigir ajustes.`,
      recommendations: [
        "Confira se a URL e o caminho do recurso estão corretos.",
        "Verifique permissões e requisitos de autenticação.",
        "Consulte a documentação da aplicação ou da API.",
      ],
    };
  }

  if (statusCode !== null && statusCode >= 300) {
    return {
      status: "DEGRADED",
      summary:
        `O servidor respondeu com HTTP ${statusCode}, indicando um redirecionamento que não foi seguido.`,
      recommendations: [
        "Confira o endereço de destino do redirecionamento.",
        "Teste diretamente a URL final, se ela for conhecida.",
        "Verifique se o redirecionamento é esperado.",
      ],
    };
  }

  if (result.latencyMs >= 2000) {
    return {
      status: "DEGRADED",
      summary:
        "O serviço respondeu com sucesso, mas apresentou latência elevada.",
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

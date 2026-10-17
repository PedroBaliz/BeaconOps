
import { describe, it, expect } from "vitest";
import { analyzeResult } from "../../src/core/analyzer.js";
import type { CheckResult } from "../../src/core/checker.js";

function createCheckResult(
  overrides: Partial<CheckResult> = {}
): CheckResult {
  return {
    url: "https://example.com",
    statusCode: 200,
    latencyMs: 100,
    isOnline: true,
    error: null,
    checkedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("analyzeResult", () => {
  it("classifica uma resposta saudável como UP", () => {
    const result = analyzeResult(createCheckResult());

    expect(result.status).toBe("UP");
    expect(result.summary).toContain("sucesso");
    expect(result.recommendations).toHaveLength(2);
  });

  it("classifica latência elevada como DEGRADED", () => {
    const result = analyzeResult(
      createCheckResult({ latencyMs: 2000 })
    );

    expect(result.status).toBe("DEGRADED");
    expect(result.summary).toContain("latência elevada");
  });

  it("classifica erros HTTP 500 como DEGRADED", () => {
    const result = analyzeResult(
      createCheckResult({ statusCode: 500 })
    );

    expect(result.status).toBe("DEGRADED");
    expect(result.summary).toContain("HTTP 500");
  });

  it("classifica erros HTTP 404 como DEGRADED", () => {
    const result = analyzeResult(
      createCheckResult({ statusCode: 404 })
    );

    expect(result.status).toBe("DEGRADED");
    expect(result.summary).toContain("HTTP 404");
  });

  it("classifica redirecionamentos como DEGRADED", () => {
    const result = analyzeResult(
      createCheckResult({ statusCode: 301 })
    );

    expect(result.status).toBe("DEGRADED");
    expect(result.summary).toContain("redirecionamento");
  });

  it("classifica um serviço inacessível como DOWN", () => {
    const result = analyzeResult(
      createCheckResult({
        isOnline: false,
        statusCode: null,
        error: "Tempo limite excedido",
      })
    );

    expect(result.status).toBe("DOWN");
    expect(result.summary).toBe("Tempo limite excedido");
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("usa uma mensagem padrão quando não há erro informado", () => {
    const result = analyzeResult(
      createCheckResult({
        isOnline: false,
        statusCode: null,
        error: null,
      })
    );

    expect(result.status).toBe("DOWN");
    expect(result.summary).toContain("comunicação");
  });
});

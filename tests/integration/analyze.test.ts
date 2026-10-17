
import { describe, it, expect, vi, afterEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../src/core/checker.js", () => ({
  checkUrl: vi.fn(),
}));

vi.mock("../../src/core/analyzer.js", () => ({
  analyzeResult: vi.fn(),
}));

vi.mock("../../src/db/history.js", () => ({
  saveAnalysis: vi.fn(),
  getAnalysisHistory: vi.fn(),
}));

vi.mock("../../src/db/monitored-services.js", () => ({
  createMonitoredService: vi.fn(),
  getMonitoredServices: vi.fn(),
}));

import router from "../../src/api/analyze.js";
import { checkUrl } from "../../src/core/checker.js";
import { analyzeResult } from "../../src/core/analyzer.js";
import { saveAnalysis } from "../../src/db/history.js";

const app = express();
app.use(express.json());
app.use("/api", router);

describe("POST /api/analyze", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("analisa uma URL válida e retorna sucesso", async () => {
    vi.mocked(checkUrl).mockResolvedValue({
      url: "https://example.com/",
      statusCode: 200,
      latencyMs: 120,
      isOnline: true,
      error: null,
      checkedAt: new Date().toISOString(),
    });

    vi.mocked(analyzeResult).mockReturnValue({
      status: "UP",
      summary: "Serviço funcionando.",
      recommendations: ["Nenhuma ação necessária."],
    });

    vi.mocked(saveAnalysis).mockResolvedValue(undefined);

    const response = await request(app)
      .post("/api/analyze")
      .send({ url: "https://example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.result.statusCode).toBe(200);
    expect(response.body.analysis.status).toBe("UP");
    expect(checkUrl).toHaveBeenCalledWith("https://example.com/");
    expect(saveAnalysis).toHaveBeenCalledTimes(1);
  });

  it("rejeita uma URL vazia", async () => {
    const response = await request(app)
      .post("/api/analyze")
      .send({ url: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Informe uma URL válida.");
    expect(checkUrl).not.toHaveBeenCalled();
  });

  it("rejeita uma URL com formato inválido", async () => {
    const response = await request(app)
      .post("/api/analyze")
      .send({ url: "endereco-invalido" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("O formato da URL é inválido.");
    expect(checkUrl).not.toHaveBeenCalled();
  });

  it("rejeita protocolos diferentes de HTTP e HTTPS", async () => {
    const response = await request(app)
      .post("/api/analyze")
      .send({ url: "ftp://example.com" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "A URL deve utilizar HTTP ou HTTPS."
    );
    expect(checkUrl).not.toHaveBeenCalled();
  });
});

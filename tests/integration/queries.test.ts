
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
  getDueMonitoredServices: vi.fn(),
  scheduleNextCheck: vi.fn(),
}));

import router from "../../src/api/analyze.js";
import { getAnalysisHistory } from "../../src/db/history.js";
import { getMonitoredServices } from "../../src/db/monitored-services.js";

const app = express();

app.use(express.json());
app.use("/api", router);

describe("GET /api/history", () => {
  afterEach(() => vi.clearAllMocks());

  it("retorna o histórico de análises", async () => {
    vi.mocked(getAnalysisHistory).mockResolvedValue([
      {
        url: "https://example.com/",
        statusCode: 200,
        latencyMs: 120,
        isOnline: true,
        error: null,
        analysisStatus: "UP",
        summary: "Serviço funcionando.",
        recommendations: ["Nenhuma ação necessária."],
        checkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ] as never);

    const response = await request(app).get("/api/history");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(1);
    expect(response.body.history).toHaveLength(1);
    expect(response.body.history[0].url).toBe("https://example.com/");
  });

  it("retorna lista vazia quando não há histórico", async () => {
    vi.mocked(getAnalysisHistory).mockResolvedValue([] as never);

    const response = await request(app).get("/api/history");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.history).toEqual([]);
  });

  it("retorna 500 se a consulta ao histórico falhar", async () => {
    vi.mocked(getAnalysisHistory).mockRejectedValue(
      new Error("falha no banco"),
    );

    const response = await request(app).get("/api/history");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      "Não foi possível consultar o histórico.",
    );
  });
});

describe("GET /api/monitors", () => {
  afterEach(() => vi.clearAllMocks());

  it("retorna os serviços monitorados", async () => {
    vi.mocked(getMonitoredServices).mockResolvedValue([
      {
        id: 1,
        name: "Meu serviço",
        url: "https://example.com/",
        intervalSeconds: 300,
        isActive: true,
      },
    ] as never);

    const response = await request(app).get("/api/monitors");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(1);
    expect(response.body.monitors).toHaveLength(1);
    expect(response.body.monitors[0].name).toBe("Meu serviço");
  });

  it("retorna lista vazia quando não há serviços", async () => {
    vi.mocked(getMonitoredServices).mockResolvedValue([] as never);

    const response = await request(app).get("/api/monitors");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.monitors).toEqual([]);
  });

  it("retorna 500 se a consulta aos serviços falhar", async () => {
    vi.mocked(getMonitoredServices).mockRejectedValue(
      new Error("falha no banco"),
    );

    const response = await request(app).get("/api/monitors");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      "Não foi possível consultar os serviços monitorados.",
    );
  });
});

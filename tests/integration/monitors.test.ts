
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
import { createMonitoredService } from "../../src/db/monitored-services.js";

const app = express();
app.use(express.json());
app.use("/api", router);

describe("POST /api/monitors", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("cadastra um serviço com dados válidos", async () => {
    vi.mocked(createMonitoredService).mockResolvedValue({
      id: 1,
      name: "Meu serviço",
      url: "https://example.com/",
      intervalSeconds: 300,
      isActive: true,
    } as never);

    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Meu serviço",
        url: "https://example.com",
        intervalSeconds: 300,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(createMonitoredService).toHaveBeenCalledWith(
      "Meu serviço",
      "https://example.com/",
      300
    );
  });

  it("rejeita um nome vazio", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "   ",
        url: "https://example.com",
        intervalSeconds: 300,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("nome");
    expect(createMonitoredService).not.toHaveBeenCalled();
  });

  it("rejeita uma URL inválida", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Meu serviço",
        url: "endereco-invalido",
        intervalSeconds: 300,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("O formato da URL é inválido.");
    expect(createMonitoredService).not.toHaveBeenCalled();
  });

  it("rejeita protocolos diferentes de HTTP e HTTPS", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Meu serviço",
        url: "ftp://example.com",
        intervalSeconds: 300,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "A URL deve utilizar HTTP ou HTTPS."
    );
    expect(createMonitoredService).not.toHaveBeenCalled();
  });

  it("rejeita intervalos menores que 60 segundos", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Meu serviço",
        url: "https://example.com",
        intervalSeconds: 30,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("intervalo");
    expect(createMonitoredService).not.toHaveBeenCalled();
  });

  it("rejeita intervalos maiores que 86400 segundos", async () => {
    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Meu serviço",
        url: "https://example.com",
        intervalSeconds: 90000,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("intervalo");
    expect(createMonitoredService).not.toHaveBeenCalled();
  });

  it("usa 300 segundos quando o intervalo não é informado", async () => {
    vi.mocked(createMonitoredService).mockResolvedValue({
      id: 2,
      name: "Serviço padrão",
      url: "https://example.com/",
      intervalSeconds: 300,
      isActive: true,
    } as never);

    const response = await request(app)
      .post("/api/monitors")
      .send({
        name: "Serviço padrão",
        url: "https://example.com",
      });

    expect(response.status).toBe(201);
    expect(createMonitoredService).toHaveBeenCalledWith(
      "Serviço padrão",
      "https://example.com/",
      300
    );
  });
});

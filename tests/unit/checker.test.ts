
import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../src/core/safe-dns.js", () => ({
  resolvePublicAddresses: vi.fn().mockResolvedValue([
    {
      address: "93.184.216.34",
      family: 4,
    },
  ]),
}));

import { checkUrl } from "../../src/core/checker.js";

describe("checkUrl", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("retorna online para uma resposta HTTP 200", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
    } as never);

    const result = await checkUrl("https://example.com");

    expect(result.isOnline).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.error).toBeNull();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("identifica respostas HTTP 500", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 500,
    } as never);

    const result = await checkUrl("https://example.com");

    expect(result.isOnline).toBe(true);
    expect(result.statusCode).toBe(500);
    expect(result.error).toContain("HTTP 500");
  });

  it("identifica timeout", async () => {
    vi.mocked(axios.get).mockRejectedValue({
      code: "ECONNABORTED",
      message: "timeout",
    });

    const result = await checkUrl("https://example.com", 1000);

    expect(result.isOnline).toBe(false);
    expect(result.statusCode).toBeNull();
    expect(result.error).toContain("Tempo limite excedido");
    expect(result.error).toContain("1000 ms");
  });

  it("identifica domínio não encontrado", async () => {
    vi.mocked(axios.get).mockRejectedValue({
      code: "ENOTFOUND",
      message: "getaddrinfo ENOTFOUND",
    });

    const result = await checkUrl("https://invalid.example");

    expect(result.isOnline).toBe(false);
    expect(result.error).toBe("O domínio não foi encontrado.");
  });

  it("identifica conexão recusada", async () => {
    vi.mocked(axios.get).mockRejectedValue({
      code: "ECONNREFUSED",
      message: "connect ECONNREFUSED",
    });

    const result = await checkUrl("https://example.com");

    expect(result.isOnline).toBe(false);
    expect(result.error).toBe(
      "A conexão foi recusada pelo servidor."
    );
  });

  it("identifica URL inválida reportada pelo Axios", async () => {
    vi.mocked(axios.get).mockRejectedValue({
      code: "ERR_INVALID_URL",
      message: "Invalid URL",
    });

    const result = await checkUrl("url-invalida");

    expect(result.isOnline).toBe(false);
    expect(result.error).toBe("A URL informada é inválida.");
  });

  it("inclui a data da verificação no resultado", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 204,
    } as never);

    const result = await checkUrl("https://example.com");

    expect(Number.isNaN(Date.parse(result.checkedAt))).toBe(false);
  });

  it.each([
    "ftp://example.com",
    "file:///etc/passwd",
    "javascript:alert(1)",
  ])("rejeita protocolo não permitido: %s", async (url) => {
    const result = await checkUrl(url);

    expect(result.isOnline).toBe(false);
    expect(result.error).toBe(
      "Apenas URLs HTTP e HTTPS são permitidas."
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("desativa redirecionamentos e proxies na requisição", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
    } as never);

    await checkUrl("https://example.com");

    expect(axios.get).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        maxRedirects: 0,
        proxy: false,
      })
    );
  });

  it("configura agentes HTTP e HTTPS", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
    } as never);

    await checkUrl("https://example.com");

    const config = vi.mocked(axios.get).mock.calls[0]?.[1];

    expect(config?.httpAgent).toBeDefined();
    expect(config?.httpsAgent).toBeDefined();
  });

  it("fixa o lookup HTTPS no IP público validado pelo DNS", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
    } as never);

    await checkUrl("https://example.com");

    const config = vi.mocked(axios.get).mock.calls[0]?.[1];

    const agent = config?.httpsAgent as {
      options: {
        lookup?: (
          hostname: string,
          options: { all?: boolean },
          callback: (...args: unknown[]) => void
        ) => void;
      };
    };

    const lookup = agent.options.lookup;

    expect(lookup).toBeTypeOf("function");

    let result: unknown[] = [];

    lookup!(
      "example.com",
      {},
      (...args) => {
        result = args;
      }
    );

    expect(result).toEqual([
      null,
      "93.184.216.34",
      4,
    ]);
  });
});

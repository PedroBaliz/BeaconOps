
import { describe, it, expect, vi, afterEach } from "vitest";
import { lookup } from "node:dns/promises";
import { resolvePublicAddresses } from "../../src/core/safe-dns.js";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

describe("resolvePublicAddresses", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("aceita um domínio que resolve para um IP público", async () => {
    vi.mocked(lookup).mockResolvedValue([
      {
        address: "93.184.216.34",
        family: 4,
      },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).resolves.toEqual([
      {
        address: "93.184.216.34",
        family: 4,
      },
    ]);
  });

  it("rejeita um domínio que resolve para IP privado", async () => {
    vi.mocked(lookup).mockResolvedValue([
      {
        address: "192.168.1.10",
        family: 4,
      },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });

  it("rejeita uma resolução com IP público e privado", async () => {
    vi.mocked(lookup).mockResolvedValue([
      {
        address: "93.184.216.34",
        family: 4,
      },
      {
        address: "127.0.0.1",
        family: 4,
      },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });

  it("rejeita um domínio sem endereços encontrados", async () => {
    vi.mocked(lookup).mockResolvedValue([]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });

  it("rejeita falhas na resolução DNS", async () => {
    vi.mocked(lookup).mockRejectedValue(
      new Error("DNS lookup failed")
    );

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });
});

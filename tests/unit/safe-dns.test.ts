
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
      { address: "93.184.216.34", family: 4 },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).resolves.toEqual([
      { address: "93.184.216.34", family: 4 },
    ]);
  });

  it("rejeita um domínio que resolve para IP privado", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "192.168.1.10", family: 4 },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });

  it("rejeita uma resolução com IP público e privado", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
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

  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "224.0.0.1",
    "255.255.255.255",
  ])("rejeita IP IPv4 não público: %s", async (address) => {
    await expect(
      resolvePublicAddresses(address)
    ).rejects.toThrow();
  });

  it.each([
    "::1",
    "::",
    "fc00::1",
    "fe80::1",
    "ff02::1",
  ])("rejeita IP IPv6 não público: %s", async (address) => {
    await expect(
      resolvePublicAddresses(address)
    ).rejects.toThrow();
  });

  it("rejeita IPv4 privado representado em IPv6", async () => {
    await expect(
      resolvePublicAddresses("::ffff:192.168.1.1")
    ).rejects.toThrow();
  });

  it("aceita um IP IPv4 público literal", async () => {
    await expect(
      resolvePublicAddresses("93.184.216.34")
    ).resolves.toEqual([
      { address: "93.184.216.34", family: 4 },
    ]);
  });

  it("rejeita uma resposta DNS com IPv6 local", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "2606:4700:4700::1111", family: 6 },
      { address: "fe80::1", family: 6 },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });

  it.each([
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "100.64.0.1",
    "2001:db8::1",
    "2002::1",
  ])("rejeita IP reservado ou especial: %s", async (address) => {
    await expect(
      resolvePublicAddresses(address)
    ).rejects.toThrow();
  });

  it("rejeita uma resolução DNS que mistura IP público e reservado", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "192.0.2.1", family: 4 },
    ]);

    await expect(
      resolvePublicAddresses("example.com")
    ).rejects.toThrow();
  });
});

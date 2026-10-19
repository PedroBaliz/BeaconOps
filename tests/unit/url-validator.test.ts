
import { describe, it, expect } from "vitest";
import { validatePublicUrl } from "../../src/core/url-validator.js";

describe("validatePublicUrl", () => {
  it("aceita uma URL HTTPS pública", () => {
    const result = validatePublicUrl("https://example.com");

    expect(result.ok).toBe(true);
  });

  it("aceita uma URL HTTP pública", () => {
    const result = validatePublicUrl("http://example.com");

    expect(result.ok).toBe(true);
  });

  it("rejeita localhost", () => {
    const result = validatePublicUrl("http://localhost:3000");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("localhost");
  });

  it("rejeita 127.0.0.1", () => {
    const result = validatePublicUrl("http://127.0.0.1");

    expect(result.ok).toBe(false);
  });

  it("rejeita IP privado 192.168.x.x", () => {
    const result = validatePublicUrl("http://192.168.1.10");

    expect(result.ok).toBe(false);
  });

  it("rejeita IP privado 10.x.x.x", () => {
    const result = validatePublicUrl("http://10.0.0.1");

    expect(result.ok).toBe(false);
  });

  it("rejeita IP privado 172.16.x.x", () => {
    const result = validatePublicUrl("http://172.16.0.1");

    expect(result.ok).toBe(false);
  });

  it("rejeita protocolo FTP", () => {
    const result = validatePublicUrl("ftp://example.com");

    expect(result.ok).toBe(false);
  });

  it("rejeita URL malformada", () => {
    const result = validatePublicUrl("nao-e-uma-url");

    expect(result.ok).toBe(false);
  });
});

import { isIP } from "node:net";

interface UrlValidationResult {
  ok: boolean;
  error?: string;
}

export function validatePublicUrl(
  input: string
): UrlValidationResult {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    return {
      ok: false,
      error: "A URL informada é inválida.",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      error: "A URL deve utilizar HTTP ou HTTPS.",
    };
  }

  if (url.username || url.password) {
    return {
      ok: false,
      error: "URLs com credenciais não são permitidas.",
    };
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    return {
      ok: false,
      error: "Endereços localhost ou locais não são permitidos.",
    };
  }

  if (isIP(hostname) !== 0) {
    if (!isPublicIp(hostname)) {
      return {
        ok: false,
        error: "Endereços IP privados ou reservados não são permitidos.",
      };
    }
  }

  return { ok: true };
}

function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;

    if (a === undefined || b === undefined) return false;

    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0)
    ) {
      return false;
    }

    return true;
  }

  if (isIP(ip) === 6) {
    const normalized = ip.toLowerCase();

    if (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8:")
    ) {
      return false;
    }

    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);

      if (isIP(mapped) === 4) {
        return isPublicIp(mapped);
      }

      return false;
    }

    return normalized.startsWith("2") || normalized.startsWith("3");
  }

  return false;
}
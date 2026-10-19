
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export interface PublicAddress {
  address: string;
  family: 4 | 6;
}

export async function resolvePublicAddresses(
  hostname: string
): Promise<PublicAddress[]> {
  let addresses: PublicAddress[];

  try {
    const results = await lookup(hostname, {
      all: true,
      verbatim: true,
    });

    addresses = results.map((result) => ({
      address: result.address,
      family: result.family as 4 | 6,
    }));
  } catch (error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOTFOUND"
  ) {
    throw new Error("O domínio não foi encontrado.");
  }

  throw new Error("Não foi possível resolver o domínio via DNS.");
}

  if (addresses.length === 0) {
    throw new Error("O domínio não possui endereços IP encontrados.");
  }

  if (addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error(
      "O domínio resolve para um endereço IP privado ou reservado."
    );
  }

  return addresses;
}

function isPublicIp(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [a, b, c] = octets;

    if (a === undefined || b === undefined || c === undefined) {
      return false;
    }

    // Rejeita endereços não globais, locais ou reservados.
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
      (a === 192 && b === 2) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    ) {
      return false;
    }

    return true;
  }

  if (family === 6) {
    const normalized = address.toLowerCase();

    // Endereços IPv4 mapeados em IPv6.
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice(7);

      if (isIP(mapped) === 4) {
        return isPublicIp(mapped);
      }

      return false;
    }

    // Aceita apenas o espaço global unicast 2000::/3.
    if (!/^2[0-9a-f]{0,3}:/.test(normalized)) {
      return false;
    }

    // Rejeita prefixos IPv6 especiais ou reservados conhecidos.
    if (
      normalized.startsWith("2001:db8:") ||
      normalized.startsWith("2001:10:") ||
      normalized.startsWith("2001:20:") ||
      normalized.startsWith("2002:")
    ) {
      return false;
    }

    return true;
  }

  return false;
}

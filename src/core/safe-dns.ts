
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

export interface PublicAddress {
  address: string;
  family: 4 | 6;
}

export async function resolvePublicAddresses(
  hostname: string
): Promise<PublicAddress[]> {
  let addresses: PublicAddress[];

  if (isIP(hostname) !== 0) {
    if (!isPublicIp(hostname)) {
      throw new Error(
        "O endereço IP é privado, reservado ou não público."
      );
    }

    return [
      {
        address: hostname,
        family: isIP(hostname) as 4 | 6,
      },
    ];
  }

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
  try {
    const parsed = ipaddr.parse(address);

    if (parsed.kind() === "ipv6") {
      const ipv6 = parsed as ipaddr.IPv6;

      if (ipv6.isIPv4MappedAddress()) {
        return isPublicIp(
          ipv6.toIPv4Address().toString()
        );
      }
    }

    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

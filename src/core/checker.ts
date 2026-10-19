
import axios from "axios";
import type { AxiosError } from "axios";
import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";
import type { AgentOptions } from "node:http";
import { resolvePublicAddresses } from "./safe-dns.js";

export interface CheckResult {
  url: string;
  statusCode: number | null;
  latencyMs: number;
  isOnline: boolean;
  error: string | null;
  checkedAt: string;
}

export async function checkUrl(
  url: string,
  timeoutMs: number = 5000
): Promise<CheckResult> {
  const startTime = Date.now();
  let httpAgent: HttpAgent | undefined;
  let httpsAgent: HttpsAgent | undefined;

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Apenas URLs HTTP e HTTPS são permitidas.");
    }

    const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");

    const addresses = await resolvePublicAddresses(hostname);
    const selectedAddress = addresses[0];

    if (!selectedAddress) {
      throw new Error("Nenhum endereço IP público foi encontrado.");
    }

    const pinnedLookup: NonNullable<AgentOptions["lookup"]> = (
      _hostname,
      options,
      callback
    ) => {
      if (typeof options === "object" && options.all) {
        callback(null, [
          {
            address: selectedAddress.address,
            family: selectedAddress.family,
          },
        ]);
        return;
      }

      callback(
        null,
        selectedAddress.address,
        selectedAddress.family
      );
    };

    httpAgent = new HttpAgent({
      lookup: pinnedLookup,
    });

    httpsAgent = new HttpsAgent({
      lookup: pinnedLookup,
    });

    const response = await axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 0,
      maxContentLength: 1024 * 1024,
      responseType: "text",
      validateStatus: () => true,
      httpAgent,
      httpsAgent,
      proxy: false,
    });

    const latencyMs = Date.now() - startTime;
    const statusCode = response.status;
    const isSuccessful = statusCode >= 200 && statusCode < 300;

    return {
      url,
      statusCode,
      latencyMs,
      isOnline: true,
      error: isSuccessful
        ? null
        : `O servidor respondeu com HTTP ${statusCode}.`,
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const axiosError = error as AxiosError;
    let message = "Erro desconhecido ao verificar a URL.";

    if (
      error instanceof Error &&
      typeof axiosError.code !== "string"
    ) {
      message = error.message;
    } else if (
      axiosError.code === "ECONNABORTED" ||
      axiosError.code === "ETIMEDOUT"
    ) {
      message = `Tempo limite excedido (${timeoutMs} ms).`;
    } else if (axiosError.code === "ENOTFOUND") {
      message = "O domínio não foi encontrado.";
    } else if (axiosError.code === "ECONNREFUSED") {
      message = "A conexão foi recusada pelo servidor.";
    } else if (axiosError.code === "ECONNRESET") {
      message = "A conexão foi interrompida.";
    } else if (axiosError.code === "ERR_INVALID_URL") {
      message = "A URL informada é inválida.";
    } else if (axiosError.code === "ERR_CANCELED") {
      message = "A verificação foi cancelada.";
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    return {
      url,
      statusCode: axiosError.response?.status ?? null,
      latencyMs,
      isOnline: false,
      error: message,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    httpAgent?.destroy();
    httpsAgent?.destroy();
  }
}

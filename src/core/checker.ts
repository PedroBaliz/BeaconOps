import axios from "axios";
import type { AxiosError } from "axios";

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

  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      maxRedirects: 0,
      maxContentLength: 1024 * 1024,
      responseType: "text",
      validateStatus: () => true,
    });

    const latencyMs = Date.now() - startTime;
    const isOnline =
      response.status >= 200 && response.status < 300;

    return {
      url,
      statusCode: response.status,
      latencyMs,
      isOnline,
      error: isOnline
        ? null
        : "A URL respondeu com HTTP " + response.status + ".",
      checkedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const axiosError = error as AxiosError;

    let message = "Erro desconhecido ao verificar a URL.";

    if (
      axiosError.code === "ECONNABORTED" ||
      axiosError.code === "ETIMEDOUT"
    ) {
      message = "Tempo limite excedido (" + timeoutMs + " ms).";
    } else if (axiosError.code === "ENOTFOUND") {
      message = "O domínio não foi encontrado.";
    } else if (axiosError.code === "ECONNREFUSED") {
      message = "A conexão foi recusada pelo servidor.";
    } else if (axiosError.code === "ECONNRESET") {
      message = "A conexão foi interrompida.";
    } else if (axiosError.code === "ERR_INVALID_URL") {
      message = "A URL informada é inválida.";
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
  }
}
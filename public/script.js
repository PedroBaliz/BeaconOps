
const form = document.getElementById("analyze-form");
const urlInput = document.getElementById("url");
const button = document.getElementById("analyze-button");
const message = document.getElementById("message");
const results = document.getElementById("results");

const statusValue = document.getElementById("status-value");
const httpValue = document.getElementById("http-value");
const latencyValue = document.getElementById("latency-value");
const statusDescription = document.getElementById("status-description");
const summary = document.getElementById("summary");
const recommendations = document.getElementById("recommendations");
const checkedAt = document.getElementById("checked-at");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();

  let parsedUrl;

  try {
    parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocolo inválido.");
    }
  } catch {
    message.textContent =
      "Informe uma URL válida começando com http:// ou https://.";
    results.hidden = true;
    return;
  }

  button.disabled = true;
  button.textContent = "Analisando...";
  message.textContent = "Verificando o site. Aguarde...";
  results.hidden = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Não foi possível analisar o site."
      );
    }

    const result = data.result;
    const analysis = data.analysis;

    if (!result || !analysis) {
      throw new Error("O servidor retornou uma resposta incompleta.");
    }

    statusValue.textContent = analysis.status || "UNKNOWN";

    statusValue.classList.remove(
      "status-up",
      "status-degraded",
      "status-down"
    );

    const statusClasses = {
      UP: "status-up",
      DEGRADED: "status-degraded",
      DOWN: "status-down"
    };

    statusValue.classList.add(
      statusClasses[analysis.status] || "status-down"
    );

    httpValue.textContent = result.statusCode ?? "—";

    latencyValue.textContent =
      typeof result.latencyMs === "number"
        ? `${result.latencyMs} ms`
        : "—";

    statusDescription.textContent =
      analysis.status === "UP"
        ? "Serviço respondendo normalmente"
        : analysis.status === "DEGRADED"
          ? "Serviço com desempenho degradado"
          : "Serviço com falha ou situação inesperada";

    summary.textContent =
      analysis.summary || "Não há diagnóstico disponível.";

    recommendations.replaceChildren();

    const items = Array.isArray(analysis.recommendations)
      ? analysis.recommendations
      : [];

    if (items.length === 0) {
      const item = document.createElement("li");
      item.textContent = "Nenhuma recomendação disponível.";
      recommendations.appendChild(item);
    } else {
      for (const recommendation of items) {
        const item = document.createElement("li");
        item.textContent = recommendation;
        recommendations.appendChild(item);
      }
    }

    const checkedDate = new Date(result.checkedAt);

    checkedAt.textContent = Number.isNaN(checkedDate.getTime())
      ? "Horário indisponível"
      : `Verificado às ${checkedDate.toLocaleTimeString("pt-BR")}`;

    results.hidden = false;
    message.textContent = "Análise concluída.";
  } catch (error) {
    message.textContent =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro inesperado.";
  } finally {
    button.disabled = false;
    button.innerHTML = 'Analisar site <span>→</span>';
  }
});

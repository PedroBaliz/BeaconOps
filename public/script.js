
const form = document.getElementById("analyze-form");
const urlInput = document.getElementById("url");
const button = document.getElementById("analyze-button");
const message = document.getElementById("message");
const results = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();

  if (!url) {
    message.textContent = "Informe o endereço do site.";
    return;
  }

  button.disabled = true;
  button.textContent = "Analisando...";
  message.textContent = "Verificando o site. Aguarde...";
  results.hidden = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Não foi possível analisar o site.");
    }

    const { result, analysis } = data;

    const statusValue = document.getElementById("status-value");
    statusValue.textContent = analysis.status;
    statusValue.classList.remove("status-up", "status-degraded", "status-down");

    const statusClasses = {
      UP: "status-up",
      DEGRADED: "status-degraded",
      DOWN: "status-down"
    };

    statusValue.classList.add(
      statusClasses[analysis.status] || "status-down"
    );

    document.getElementById("http-value").textContent =
      result.statusCode ?? "—";

    document.getElementById("latency-value").textContent =
      typeof result.latencyMs === "number"
        ? `${result.latencyMs} ms`
        : "—";

    document.getElementById("status-description").textContent =
      analysis.status === "UP"
        ? "Resposta HTTP de sucesso"
        : analysis.status === "DEGRADED"
          ? "Resposta lenta"
          : "Falha ou resposta inesperada";

    document.getElementById("summary").textContent = analysis.summary;

    const list = document.getElementById("recommendations");
    list.replaceChildren();

    for (const recommendation of analysis.recommendations) {
      const item = document.createElement("li");
      item.textContent = recommendation;
      list.appendChild(item);
    }

    document.getElementById("checked-at").textContent =
      `Verificado às ${new Date(result.checkedAt).toLocaleTimeString("pt-BR")}`;

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

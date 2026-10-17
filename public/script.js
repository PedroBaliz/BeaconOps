
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

const historyBody = document.getElementById("history-body");
const historyMessage = document.getElementById("history-message");
const refreshHistoryButton = document.getElementById("refresh-history");

const monitorForm = document.getElementById("monitor-form");
const monitorNameInput = document.getElementById("monitor-name");
const monitorUrlInput = document.getElementById("monitor-url");
const monitorIntervalInput = document.getElementById("monitor-interval");
const monitorSubmitButton = document.getElementById("monitor-submit");
const monitorMessage = document.getElementById("monitor-message");
const monitorsBody = document.getElementById("monitors-body");
const refreshMonitorsButton = document.getElementById("refresh-monitors");


function formatInterval(seconds) {
  const minutes = seconds / 60;

  return minutes === 1
    ? "1 minuto"
    : `${minutes} minutos`;
}

async function loadMonitors() {
  monitorMessage.textContent = "Carregando serviços...";
  refreshMonitorsButton.disabled = true;

  try {
    const response = await fetch("/api/monitors");
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Não foi possível carregar os serviços."
      );
    }

    if (!Array.isArray(data.monitors)) {
      throw new Error("A resposta de serviços é inválida.");
    }

    monitorsBody.replaceChildren();

    if (data.monitors.length === 0) {
      monitorMessage.textContent =
        "Nenhum serviço cadastrado. Adicione o primeiro acima.";
      return;
    }

    for (const monitor of data.monitors) {
      const row = document.createElement("tr");

      row.appendChild(createCell(monitor.name || "—"));
      row.appendChild(createCell(monitor.url || "—"));
      row.appendChild(
        createCell(formatInterval(monitor.intervalSeconds))
      );

      const situationCell = document.createElement("td");
      const badge = document.createElement("span");

      badge.classList.add("status-badge");
      badge.textContent = monitor.isActive
        ? "ATIVO"
        : "INATIVO";

      badge.classList.add(
        monitor.isActive ? "status-up" : "status-down"
      );

      situationCell.appendChild(badge);
      row.appendChild(situationCell);
      monitorsBody.appendChild(row);
    }

    monitorMessage.textContent =
      `${data.monitors.length} serviço(s) cadastrado(s).`;
  } catch (error) {
    monitorMessage.textContent =
      error instanceof Error
        ? error.message
        : "Erro ao carregar os serviços.";
  } finally {
    refreshMonitorsButton.disabled = false;
  }
}


const statusClasses = {
  UP: "status-up",
  DEGRADED: "status-degraded",
  DOWN: "status-down"
};

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("pt-BR");
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function createStatusCell(status) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");

  badge.textContent = status || "UNKNOWN";
  badge.classList.add("status-badge");

  const statusClass = statusClasses[status];

  if (statusClass) {
    badge.classList.add(statusClass);
  }

  cell.appendChild(badge);
  return cell;
}

async function loadHistory() {
  historyMessage.textContent = "Carregando histórico...";
  refreshHistoryButton.disabled = true;

  try {
    const response = await fetch("/api/history");
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Não foi possível carregar o histórico."
      );
    }

    if (!Array.isArray(data.history)) {
      throw new Error("O servidor retornou um histórico inválido.");
    }

    historyBody.replaceChildren();

    if (data.history.length === 0) {
      historyMessage.textContent =
        "Nenhuma análise registrada ainda.";
      return;
    }

    for (const item of data.history) {
      const row = document.createElement("tr");

      row.appendChild(createCell(item.url || "—"));
      row.appendChild(createStatusCell(item.analysisStatus));
      row.appendChild(createCell(
        item.statusCode == null ? "—" : String(item.statusCode)
      ));
      row.appendChild(createCell(
        typeof item.latencyMs === "number"
          ? `${item.latencyMs} ms`
          : "—"
      ));
      row.appendChild(createCell(formatDate(item.checkedAt)));

      historyBody.appendChild(row);
    }

    historyMessage.textContent =
      `${data.history.length} análise(s) encontrada(s).`;
  } catch (error) {
    historyMessage.textContent =
      error instanceof Error
        ? error.message
        : "Erro ao carregar o histórico.";
  } finally {
    refreshHistoryButton.disabled = false;
  }
}

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
      body: JSON.stringify({ url: parsedUrl.toString() })
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

    checkedAt.textContent = `Verificado às ${formatDate(result.checkedAt)}`;

    results.hidden = false;
    message.textContent = "Análise concluída.";

    await loadHistory();
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

refreshHistoryButton.addEventListener("click", loadHistory);

loadHistory();


monitorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = monitorNameInput.value.trim();
  const url = monitorUrlInput.value.trim();
  const intervalSeconds = Number(monitorIntervalInput.value);

  let parsedUrl;

  try {
    parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocolo inválido.");
    }
  } catch {
    monitorMessage.textContent =
      "Informe uma URL válida começando com http:// ou https://.";
    return;
  }

  monitorSubmitButton.disabled = true;
  monitorSubmitButton.textContent = "Cadastrando...";
  monitorMessage.textContent = "Registrando serviço...";

  try {
    const response = await fetch("/api/monitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        url: parsedUrl.toString(),
        intervalSeconds
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Não foi possível cadastrar o serviço."
      );
    }

    monitorForm.reset();
    monitorIntervalInput.value = "300";

    monitorMessage.textContent =
      "Serviço cadastrado com sucesso.";

    await loadMonitors();
  } catch (error) {
    monitorMessage.textContent =
      error instanceof Error
        ? error.message
        : "Erro ao cadastrar o serviço.";
  } finally {
    monitorSubmitButton.disabled = false;
    monitorSubmitButton.textContent = "Cadastrar serviço";
  }
});

refreshMonitorsButton.addEventListener("click", loadMonitors);

loadMonitors();



const analyzeForm = document.getElementById("analyze-form");
const urlInput = document.getElementById("url");
const analyzeButton = document.getElementById("analyze-button");
const message = document.getElementById("message");

const resultsSection = document.getElementById("results");
const statusValue = document.getElementById("status-value");
const checkedAt = document.getElementById("checked-at");
const statusDescription = document.getElementById("status-description");
const httpValue = document.getElementById("http-value");
const latencyValue = document.getElementById("latency-value");
const summary = document.getElementById("summary");
const recommendations = document.getElementById("recommendations");

const historyMessage = document.getElementById("history-message");
const historyBody = document.getElementById("history-body");
const refreshHistoryButton = document.getElementById("refresh-history");

const monitorForm = document.getElementById("monitor-form");
const monitorNameInput = document.getElementById("monitor-name");
const monitorUrlInput = document.getElementById("monitor-url");
const monitorIntervalInput = document.getElementById("monitor-interval");
const monitorSubmitButton = document.getElementById("monitor-submit");
const monitorMessage = document.getElementById("monitor-message");
const monitorsBody = document.getElementById("monitors-body");
const refreshMonitorsButton = document.getElementById("refresh-monitors");

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "—";
  return cell;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR");
}

function formatInterval(seconds) {
  if (!Number.isFinite(Number(seconds))) return "—";

  const value = Number(seconds);

  if (value < 60) return `${value} segundos`;

  const minutes = value / 60;

  if (minutes % 60 === 0 && minutes >= 60) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }

  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

function statusClasses(status) {
  const classes = {
    UP: "status-up",
    DEGRADED: "status-degraded",
    DOWN: "status-down",
  };

  return classes[status] || "status-unknown";
}

function createStatusBadge(status, label) {
  const badge = document.createElement("span");
  badge.classList.add("status-badge", statusClasses(status));
  badge.textContent = label;
  return badge;
}

function displayStatus(status) {
  const labels = {
    UP: "UP",
    DEGRADED: "DEGRADADO",
    DOWN: "DOWN",
  };

  return labels[status] || "SEM HISTÓRICO";
}

analyzeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = urlInput.value.trim();

  if (!url) {
    message.textContent = "Informe uma URL para analisar.";
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analisando...";
  message.textContent = "Verificando a aplicação...";
  resultsSection.hidden = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Não foi possível analisar a URL.");
    }

    const result = data.result;
    const analysis = data.analysis;

    statusValue.textContent = analysis.status;
    statusDescription.textContent = analysis.summary || "";
    checkedAt.textContent = formatDate(result.checkedAt);
    httpValue.textContent = result.statusCode ?? "—";
    latencyValue.textContent =
      result.latencyMs != null ? `${result.latencyMs} ms` : "—";
    summary.textContent = analysis.summary || "Nenhum resumo disponível.";

    statusValue.className = "";
    statusValue.classList.add(statusClasses(analysis.status));

    recommendations.replaceChildren();

    if (
      Array.isArray(analysis.recommendations) &&
      analysis.recommendations.length > 0
    ) {
      for (const recommendation of analysis.recommendations) {
        const item = document.createElement("li");
        item.textContent = recommendation;
        recommendations.appendChild(item);
      }
    } else {
      const item = document.createElement("li");
      item.textContent = "Nenhuma recomendação disponível.";
      recommendations.appendChild(item);
    }

    resultsSection.hidden = false;
    message.textContent = "Análise concluída.";

    await loadHistory();
    await loadMonitors();
  } catch (error) {
    message.textContent =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro ao analisar a aplicação.";
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analisar aplicação";
  }
});

async function loadHistory() {
  historyMessage.textContent = "Carregando histórico...";
  refreshHistoryButton.disabled = true;

  try {
    const response = await fetch("/api/history");
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Não foi possível carregar o histórico.");
    }

    if (!Array.isArray(data.history)) {
      throw new Error("A resposta do histórico é inválida.");
    }

    historyBody.replaceChildren();

    if (data.history.length === 0) {
      historyMessage.textContent = "Nenhuma análise registrada ainda.";
      return;
    }

    for (const item of data.history) {
      const row = document.createElement("tr");

      row.appendChild(createCell(item.url));

      const statusCell = document.createElement("td");
      statusCell.appendChild(
        createStatusBadge(item.analysisStatus, displayStatus(item.analysisStatus))
      );
      row.appendChild(statusCell);

      row.appendChild(createCell(item.statusCode ?? "—"));
      row.appendChild(
        createCell(
          item.latencyMs != null ? `${item.latencyMs} ms` : "—"
        )
      );
      row.appendChild(createCell(formatDate(item.checkedAt || item.createdAt)));

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

function renderMonitor(monitor) {
  const row = document.createElement("tr");

  row.appendChild(createCell(monitor.name || "—"));
  row.appendChild(createCell(monitor.url || "—"));
  row.appendChild(createCell(formatInterval(monitor.intervalSeconds)));

  const lastStatusCell = document.createElement("td");

  if (monitor.lastStatus) {
    const statusLabel = displayStatus(monitor.lastStatus);
    lastStatusCell.appendChild(
      createStatusBadge(monitor.lastStatus, statusLabel)
    );

    if (monitor.lastLatencyMs != null) {
      const latency = document.createElement("div");
      latency.classList.add("monitor-latency");
      latency.textContent = `${monitor.lastLatencyMs} ms`;
      lastStatusCell.appendChild(latency);
    }

    if (monitor.lastCheckedAt) {
      const date = document.createElement("div");
      date.classList.add("monitor-last-checked");
      date.textContent = formatDate(monitor.lastCheckedAt);
      lastStatusCell.appendChild(date);
    }
  } else {
    lastStatusCell.appendChild(
      createStatusBadge("UNKNOWN", "SEM HISTÓRICO")
    );
  }

  row.appendChild(lastStatusCell);

  const monitoringCell = document.createElement("td");
  const isActive = monitor.isActive === true;

  monitoringCell.appendChild(
    createStatusBadge(
      isActive ? "UP" : "DOWN",
      isActive ? "ATIVO" : "INATIVO"
    )
  );

  row.appendChild(monitoringCell);

  return row;
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
      monitorsBody.appendChild(renderMonitor(monitor));
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

monitorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = monitorNameInput.value.trim();
  const url = monitorUrlInput.value.trim();
  const intervalSeconds = Number(monitorIntervalInput.value);

  if (!name) {
    monitorMessage.textContent = "Informe o nome do serviço.";
    return;
  }

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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        url: parsedUrl.toString(),
        intervalSeconds,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Não foi possível cadastrar o serviço."
      );
    }

    monitorForm.reset();
    monitorIntervalInput.value = "300";

    monitorMessage.textContent = "Serviço cadastrado com sucesso.";

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

refreshHistoryButton.addEventListener("click", loadHistory);
refreshMonitorsButton.addEventListener("click", loadMonitors);

loadHistory();
loadMonitors();

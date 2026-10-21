import { Router } from "express";
import { checkUrl } from "../core/checker.js";
import { analyzeResult } from "../core/analyzer.js";
import { saveAnalysis, getAnalysisHistory } from "../db/history.js";
import {
  createMonitoredService,
  getMonitoredServices,
  getMonitoredServiceById,
  updateMonitoredServiceInterval,
} from "../db/monitored-services.js";
import { validatePublicUrl } from "../core/url-validator.js";

const router = Router();

router.get("/history", async (_req, res) => {
  try {
    const history = await getAnalysisHistory();

    res.json({
      success: true,
      total: history.length,
      history,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível consultar o histórico.",
    });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const { url } = req.body as { url?: unknown };

    if (typeof url !== "string" || url.trim().length === 0) {
      res.status(400).json({
        error: "Informe uma URL válida.",
      });
      return;
    }

    const validation = validatePublicUrl(url);

    if (!validation.ok) {
      res.status(400).json({
        error: validation.error,
      });
      return;
    }

    const parsedUrl = new URL(url.trim());
    const result = await checkUrl(parsedUrl.toString());
    const analysis = analyzeResult(result);

    await saveAnalysis(result, analysis);

    res.json({
      success: true,
      result,
      analysis,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível analisar a URL.",
    });
  }
});

router.get("/monitors", async (_req, res) => {
  try {
    const monitors = await getMonitoredServices();

    res.json({
      success: true,
      total: monitors.length,
      monitors,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível consultar os serviços monitorados.",
    });
  }
});

router.get("/monitors/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      error: "ID do serviço inválido.",
    });
    return;
  }

  try {
    const monitor = await getMonitoredServiceById(id);

    if (!monitor) {
      res.status(404).json({
        error: "Serviço monitorado não encontrado.",
      });
      return;
    }

    res.json({
      success: true,
      monitor,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível consultar o serviço monitorado.",
    });
  }
});

router.patch("/monitors/:id/interval", async (req, res) => {
  const id = Number(req.params.id);
  const { intervalSeconds } = req.body as {
    intervalSeconds?: unknown;
  };

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      error: "ID do serviço inválido.",
    });
    return;
  }

  if (
    typeof intervalSeconds !== "number" ||
    !Number.isInteger(intervalSeconds) ||
    intervalSeconds < 60 ||
    intervalSeconds > 86400
  ) {
    res.status(400).json({
      error:
        "O intervalo deve ser um número inteiro entre 60 e 86400 segundos.",
    });
    return;
  }

  try {
    const updated = await updateMonitoredServiceInterval(
      id,
      intervalSeconds
    );

    if (!updated) {
      res.status(404).json({
        error: "Serviço monitorado não encontrado.",
      });
      return;
    }

    const monitor = await getMonitoredServiceById(id);

    res.json({
      success: true,
      message: "Intervalo de monitoramento atualizado.",
      monitor,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível atualizar o intervalo de monitoramento.",
    });
  }
});

router.post("/monitors", async (req, res) => {
  const { name, url, intervalSeconds } = req.body as {
    name?: unknown;
    url?: unknown;
    intervalSeconds?: unknown;
  };

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100
  ) {
    res.status(400).json({
      error: "O nome deve ter entre 1 e 100 caracteres.",
    });
    return;
  }

  if (typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({
      error: "Informe uma URL válida.",
    });
    return;
  }

  const validation = validatePublicUrl(url);

  if (!validation.ok) {
    res.status(400).json({
      error: validation.error,
    });
    return;
  }

  const parsedUrl = new URL(url.trim());

  const interval =
    intervalSeconds === undefined ? 300 : intervalSeconds;

  if (
    typeof interval !== "number" ||
    !Number.isInteger(interval) ||
    interval < 60 ||
    interval > 86400
  ) {
    res.status(400).json({
      error:
        "O intervalo deve ser um número inteiro entre 60 e 86400 segundos.",
    });
    return;
  }

  try {
    const monitor = await createMonitoredService(
      name.trim(),
      parsedUrl.toString(),
      interval
    );

    res.status(201).json({
      success: true,
      monitor,
    });
  } catch {
    res.status(500).json({
      error: "Não foi possível cadastrar o serviço monitorado.",
    });
  }
});

export default router;
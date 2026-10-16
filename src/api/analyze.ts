import { Router } from "express";
import { checkUrl } from "../core/checker.js";
import { analyzeResult } from "../core/analyzer.js";
import { saveAnalysis } from "../db/history.js";

const router = Router();

router.post("/analyze", async (req, res) => {
  try {
    const { url } = req.body as { url?: unknown };

    if (typeof url !== "string" || url.trim().length === 0) {
      res.status(400).json({
        error: "Informe uma URL válida.",
      });
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url.trim());
    } catch {
      res.status(400).json({
        error: "O formato da URL é inválido.",
      });
      return;
    }

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      res.status(400).json({
        error: "A URL deve utilizar HTTP ou HTTPS.",
      });
      return;
    }

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

export default router;
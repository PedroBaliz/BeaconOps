import express from "express";
import "dotenv/config";
import analyzeRouter from "./api/analyze.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMonitor } from "./core/monitor.js";

const app = express();

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const publicDir = path.resolve(currentDir, "../public");

app.use(express.static(publicDir));

const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "BeaconOps",
    status: "running",
    message: "API de análise disponível.",
  });
});

app.use("/api", analyzeRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`BeaconOps rodando na porta ${port}`);
  startMonitor();
});
import express from "express";
import "dotenv/config";
import analyzeRouter from "./api/analyze.js";

const app = express();
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

app.listen(port, () => {
  console.log(`BeaconOps rodando em http://localhost:${port}`);
});
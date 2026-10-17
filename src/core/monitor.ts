
import cron from "node-cron";
import { checkUrl } from "./checker.js";
import { analyzeResult } from "./analyzer.js";
import { saveAnalysis } from "../db/history.js";
import { getMonitoredServices } from "../db/monitored-services.js";

export function startMonitor(): void {
  cron.schedule("* * * * *", async () => {
    try {
      const services = await getMonitoredServices();

      for (const service of services) {
        if (!service.isActive) {
          continue;
        }

        const elapsedSeconds =
          (Date.now() - new Date(service.createdAt).getTime()) / 1000;

        if (elapsedSeconds < service.intervalSeconds) {
          continue;
        }

        try {
          const result = await checkUrl(service.url);
          const analysis = analyzeResult(result);

          await saveAnalysis(result, analysis);
        } catch (error) {
          console.error(
            `Falha ao monitorar ${service.url}:`,
            error instanceof Error ? error.message : error
          );
        }
      }
    } catch (error) {
      console.error(
        "Falha ao executar o ciclo de monitoramento:",
        error instanceof Error ? error.message : error
      );
    }
  });

  console.log("Agendador do BeaconOps iniciado.");
}

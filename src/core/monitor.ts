
import cron from "node-cron";
import { checkUrl } from "./checker.js";
import { analyzeResult } from "./analyzer.js";
import { saveAnalysis } from "../db/history.js";
import {
  getDueMonitoredServices,
  scheduleNextCheck,
} from "../db/monitored-services.js";

let isRunning = false;

export function startMonitor(): void {
  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      const services = await getDueMonitoredServices();

      for (const service of services) {
        try {
          const result = await checkUrl(service.url);
          const analysis = analyzeResult(result);

          await saveAnalysis(result, analysis);
        } catch (error) {
          console.error(
            `Falha ao monitorar ${service.url}:`,
            error instanceof Error ? error.message : error
          );
        } finally {
          try {
            await scheduleNextCheck(
              service.id,
              service.intervalSeconds
            );
          } catch (error) {
            console.error(
              `Falha ao agendar próxima verificação de ${service.url}:`,
              error instanceof Error ? error.message : error
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "Falha no ciclo de monitoramento:",
        error instanceof Error ? error.message : error
      );
    } finally {
      isRunning = false;
    }
  });

  console.log("Agendador do BeaconOps iniciado.");
}

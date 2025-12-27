import { config } from "dotenv";
import { connect } from "./db/connect.js";
import type { EcoCountType, EcoType } from "./interface/ecografias.js";
import { count } from "./count/count.js";
import { updateRow } from "./update-row/UpdateRow.js";
import cron from "node-cron";
import { saveReport } from "./save-report/saveReport.js";
import { loadState, saveState } from "./util/stateManager.js";
config();

async function main() {
  const countPerType: EcoCountType[] = [];
  let page = await loadState();
  const sql = await connect();
  async function sqlProcedure() {
    const totalPages = await count();

    console.log(`Processing page ${page + 1} of ${totalPages}...`);
    const offset = page * 1000;

    await updateRow(offset, sql, countPerType);
    page++;
    await saveState(page);
  }

  sqlProcedure();

  const task = cron.schedule("0 * * * *", async () => {
    console.log("Iniciando tarea programada...");
    const totalPages = await count();

    if (page > totalPages) {
      console.log("Se han procesado todas las páginas. Deteniendo el cron.");
      task.stop();
      return;
    }

    console.log(`Página actual: ${page + 1}`);
    await sqlProcedure();

    await saveReport(countPerType);
    console.log("Tarea programada completada.");
  });
}

main();

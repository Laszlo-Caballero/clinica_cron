import type { EcoCountType, EcoType } from "../interface/ecografias.js";
import fs from "fs/promises";

export async function saveReport(countPerType: EcoCountType[]) {
  const orderById = countPerType.sort((a, b) => {
    return Number(b.id) - Number(a.id);
  });

  await fs.writeFile(
    "reportes_ecos_count.json",
    JSON.stringify(orderById, null, 2)
  );

  console.log("\n📁 Reporte guardado correctamente.");
}

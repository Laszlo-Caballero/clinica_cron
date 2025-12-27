import type { ConnectionPool } from "mssql";
import {
  isEcoType,
  type EcoCountType,
  type Ecografia,
  type EcoType,
} from "../interface/ecografias.js";
import { parseHtml } from "../util/parseHtml.js";
import { parseEcoReport } from "../util/findBlock.js";

export async function updateRow(
  offset: number,
  sql: ConnectionPool,
  countPerType: EcoCountType[]
) {
  const query = `
    SELECT *
    FROM ecografiacliente
    ORDER BY id
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
  `;

  const result = await sql
    .request()
    .input("offset", offset)
    .input("limit", 1000)
    .query<Ecografia>(query);

  for (const eco of result.recordset) {
    const html = eco.cuerpo;
    const text = parseHtml(html);
    const parsed = parseEcoReport(text);
    if (parsed && isEcoType(parsed.tipo)) {
      const { resultado, tipo } = parsed;
      // await createFolder(eco, resultado, "txt", tipo);

      countPerType.push({
        id: eco.id,
        htmlContent: html,
        parsedContent: text,
        result: resultado,
        type: tipo as EcoType,
      });
    } else {
      countPerType.push({
        id: eco.id,
        htmlContent: html,
        parsedContent: text,
        result: "",
        type: "no_clasificado",
      });
    }

    const updateQuery = `
      UPDATE ecografiacliente
      SET diagnostico  = @diagnostico, resultadofinal = @resultadofinal
      WHERE id = @id;
      `;

    try {
      await sql
        .request()
        .input("diagnostico", parsed?.resultado || "")
        .input("resultadofinal", text || "")
        .input("id", eco.id)
        .query(updateQuery);
    } catch {
      countPerType.push({
        id: eco.id,
        htmlContent: html,
        parsedContent: text,
        result: parsed?.resultado || "",
        type: "error",
      });
    }

    // await createFolder(eco, text, "txt");
    // await createFolder(eco, html, "html");
  }
}

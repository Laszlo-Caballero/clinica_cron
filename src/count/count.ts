import sql from "mssql";
export async function count() {
  const count = await sql.query`SELECT COUNT(*) AS count FROM ecografiacliente`;

  const rows = count.recordset[0].count;
  // const rows = 100;
  const totalPages = Math.ceil(rows / 1000);
  console.log(`Total rows: ${rows}, Total pages: ${totalPages}`);

  return totalPages;
}

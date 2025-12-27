import * as sql from "mssql";

export async function connect() {
  try {
    console.log("Connected to the database successfully.");
    return sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      server: process.env.DB_HOST!,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    });
  } catch (error) {
    throw error;
  }
}

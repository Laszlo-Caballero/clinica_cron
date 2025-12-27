import fs from "fs/promises";
import path from "path";
import type { Ecografia } from "../interface/ecografias.js";
export async function createFolder(
  eco: Ecografia,
  text: string,
  type: "html" | "txt",
  name?: string
): Promise<void> {
  const baseDir = path.join("ecos", String(eco.id));
  const filePath = path.join(
    baseDir,
    `${name ?? "ecografia"}_${eco.id}.${type}`
  );

  await fs.mkdir(baseDir, { recursive: true });

  await fs.writeFile(filePath, text, "utf-8");
}

import * as fs from "fs/promises";

const STATE_FILE = "process_state.json";

export async function loadState(): Promise<number> {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    const state = JSON.parse(data);
    return typeof state.page === "number" ? state.page : 0;
  } catch (error) {
    return 0; // Default to 0 if file doesn't exist or error
  }
}

export async function saveState(page: number): Promise<void> {
  const state = { page };
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

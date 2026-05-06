export interface BoostcampRefreshResult {
  path: string;
  content: string;
  stdout: string;
}

export async function refreshBoostcampFromLocalHelper(input: {
  repoPath: string;
  exportDir: string;
  timezoneOffset: number;
}): Promise<BoostcampRefreshResult> {
  if (!("__TAURI_INTERNALS__" in window)) {
    throw new Error("Direct Boostcamp refresh requires the Tauri desktop app. Run `npm run desktop`, or use Upload CSV/JSON in browser dev mode.");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<BoostcampRefreshResult>("refresh_boostcamp_export", input);
}

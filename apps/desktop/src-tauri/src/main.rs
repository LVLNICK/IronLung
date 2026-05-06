use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BoostcampExportResult {
    path: String,
    content: String,
    stdout: String,
}

#[tauri::command]
fn refresh_boostcamp_export(
    repo_path: String,
    export_dir: String,
    timezone_offset: i32,
) -> Result<BoostcampExportResult, String> {
    let repo = PathBuf::from(repo_path);
    if !repo.is_dir() {
        return Err("Boostcamp helper folder was not found.".to_string());
    }
    if !repo.join(".env").is_file() {
        return Err("Missing D:\\boostcamp-mcp\\.env. Run `uv run login` in the Boostcamp helper first.".to_string());
    }

    let export_dir = PathBuf::from(export_dir);
    fs::create_dir_all(&export_dir).map_err(|error| format!("Could not create export folder: {error}"))?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("Could not create export timestamp: {error}"))?
        .as_secs();
    let output_path = export_dir.join(format!("boostcamp-training-history-latest-{stamp}.json"));

    let script = r#"
import asyncio
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from boostcampapi import BoostcampAPI

async def main():
    load_dotenv(".env")
    token = os.getenv("BOOSTCAMP_AUTH_TOKEN", "")
    if not token:
        raise SystemExit("Missing BOOSTCAMP_AUTH_TOKEN. Run `uv run login` first.")
    api = BoostcampAPI(token=token)
    data = await api.get_training_history(int(os.environ["BOOSTCAMP_TIMEZONE_OFFSET"]))
    out = Path(os.environ["BOOSTCAMP_EXPORT_PATH"])
    out.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
    print(f"Saved {out}")

asyncio.run(main())
"#;

    let output = Command::new("uv")
        .arg("run")
        .arg("python")
        .arg("-c")
        .arg(script)
        .current_dir(&repo)
        .env("BOOSTCAMP_EXPORT_PATH", path_to_string(&output_path)?)
        .env("BOOSTCAMP_TIMEZONE_OFFSET", timezone_offset.to_string())
        .output()
        .map_err(|error| format!("Could not run `uv`. Make sure uv is installed and on PATH. {error}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!("Boostcamp refresh failed.\n{stderr}\n{stdout}"));
    }

    let content = fs::read_to_string(&output_path)
        .map_err(|error| format!("Boostcamp export was created but could not be read: {error}"))?;

    Ok(BoostcampExportResult {
        path: path_to_string(&output_path)?,
        content,
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
    })
}

fn path_to_string(path: &Path) -> Result<String, String> {
    path.to_str()
        .map(|value| value.to_string())
        .ok_or_else(|| "Path contains invalid UTF-8.".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![refresh_boostcamp_export])
        .run(tauri::generate_context!())
        .expect("error while running IronLung Desktop");
}

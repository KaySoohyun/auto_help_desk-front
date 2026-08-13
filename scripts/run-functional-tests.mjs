import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.TEST_APP_PORT ?? "3199";
const appUrl = process.env.TEST_APP_URL ?? `http://localhost:${port}`;

const server = spawn("pnpm", ["next", "dev", "-p", port], {
  cwd: root,
  detached: true,
  env: { ...process.env, PORT: port, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});

function killServer() {
  try {
    process.kill(-server.pid, "SIGKILL");
  } catch {
    try {
      server.kill("SIGKILL");
    } catch {
      /* ya terminó */
    }
  }
}

let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

async function waitReady(timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${appUrl}/login`, { signal: AbortSignal.timeout(3_000) });
      if (res.status < 500) return true;
    } catch {
      /* aún compilando */
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  return false;
}

const ready = await waitReady();
if (!ready) {
  console.error("La app no quedó lista. Log:\n" + serverLog);
  killServer();
  process.exit(1);
}

console.log(`App lista en ${appUrl}. Corriendo tests...`);
const { execSync } = await import("node:child_process");
let failed = false;
try {
  execSync("pnpm vitest run", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, TEST_APP_URL: appUrl, VITE_CONFIG_NATIVE_IGNORE_WARNING: "true" },
  });
} catch {
  failed = true;
} finally {
  killServer();
}

process.exit(failed ? 1 : 0);

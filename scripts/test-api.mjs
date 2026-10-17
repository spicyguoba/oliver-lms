import { spawn, spawnSync } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";
const directory = await mkdtemp(path.join(os.tmpdir(), "oliver-lms-test-"));
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  {
    env: {
      ...process.env,
      LMS_DATA_DIR: directory,
      LMS_NEXT_DIST_DIR: ".next-http-test",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
server.stdout.on("data", (b) => {
  output += b;
});
server.stderr.on("data", (b) => {
  output += b;
});
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw Error(output);
    try {
      const r = await fetch("http://127.0.0.1:3001/api/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw Error("Test server did not become ready. " + output);
  // Keep draining server logs while tests run. spawnSync blocks these pipe
  // readers and can deadlock a longer suite on Linux's smaller pipe buffers.
  const runner = spawn(
    process.execPath,
    ["--test", "--test-timeout=90000", "tests/api.test.mjs"],
    {
      env: { ...process.env, LMS_TEST_URL: "http://127.0.0.1:3001" },
      stdio: "inherit",
    },
  );
  const [code] = await once(runner, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (process.platform === "win32")
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  else server.kill("SIGTERM");
}

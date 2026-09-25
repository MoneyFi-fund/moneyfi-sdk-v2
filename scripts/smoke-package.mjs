import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "tests", "package-consumer");
const temporary = await mkdtemp(join(tmpdir(), "moneyfi-sdk-package-"));

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, npm_config_cache: join(temporary, "npm-cache") },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

try {
  const archive = join(temporary, "moneyfi-sdk.tgz");
  const consumer = join(temporary, "consumer");
  await mkdir(consumer);
  run("pnpm", ["pack", "--out", archive], root);
  for (const name of ["package.json", "esm.mjs", "cjs.cjs", "type-test.ts", "tsconfig.json"]) {
    await copyFile(join(fixtures, name), join(consumer, name));
  }
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", archive], consumer);
  run(process.execPath, ["esm.mjs"], consumer);
  run(process.execPath, ["cjs.cjs"], consumer);
  run(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "--noEmit"], consumer);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

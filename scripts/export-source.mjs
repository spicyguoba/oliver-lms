import fs from "node:fs";
import { execFileSync } from "node:child_process";
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const group = process.argv[2];
const selected = [...new Set(paths)].filter(p=>!group || (group==='root'?!p.includes('/'):p.startsWith(group+'/')));
const files = selected.map((p) => ({
  path: p,
  mode: "100644",
  type: "blob",
  content: fs.readFileSync(p, "utf8"),
}));
process.stdout.write(JSON.stringify(files));

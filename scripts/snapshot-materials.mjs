import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
const source = path.resolve(
  process.argv[2] || "D:/GoogleDrive/Oliver's Study Material",
);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.resolve(
  process.argv[3] || "../oliver-lms-data/snapshots",
  stamp,
);
if (destination === source || destination.startsWith(source + path.sep))
  throw new Error("Snapshot must be outside the source folder.");
await fs.mkdir(destination, { recursive: true });
const digest = (file) =>
  new Promise((resolve, reject) => {
    const h = createHash("sha256");
    const s = createReadStream(file);
    s.on("data", (b) => h.update(b));
    s.on("end", () => resolve(h.digest("hex")));
    s.on("error", reject);
  });
const files = [];
async function walk(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const src = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      await walk(src);
      continue;
    }
    const relative = path.relative(source, src).split(path.sep).join("/");
    const dest = path.join(destination, relative);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    const sha256 = await digest(dest);
    if (sha256 !== (await digest(src)))
      throw new Error(
        `Source changed while copying ${relative}; rerun snapshot.`,
      );
    const stat = await fs.stat(src);
    const subject = relative.startsWith("Chinese/")
      ? "Chinese"
      : relative.startsWith("Good and Beautiful")
        ? "Math"
        : relative.startsWith("WindingCreek")
          ? "School"
          : "Reference";
    const pointer = /\.g(doc|sheet|slides)$/.test(relative);
    files.push({
      id: sha256.slice(0, 24),
      title: entry.name,
      relativePath: relative,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sha256,
      subject,
      status: pointer ? "link-only" : "needs-review",
      note: pointer
        ? "Google shortcut only; export or connect the original document to review its contents."
        : "Private local snapshot. Review before assigning.",
      snapshotAt: stamp,
    });
  }
}
await walk(source);
const manifest = {
  version: 1,
  createdAt: new Date().toISOString(),
  fileCount: files.length,
  files,
};
await fs.writeFile(
  path.join(destination, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
await fs.mkdir(".data", { recursive: true });
await fs.writeFile(
  ".data/materials-manifest.json",
  JSON.stringify(manifest, null, 2),
);
await fs.writeFile(".data/snapshot-location.txt", destination);
console.log(
  `Verified ${files.length} files. Snapshot: ${destination}\nManifest: .data/materials-manifest.json\nFuture additions: rerun this command, then import the manifest in Admin → Library. Existing assignments are retained.`,
);

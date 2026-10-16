import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { hashPassword } from "../lib/security.mjs";
if (existsSync(".env.local"))
  throw new Error(
    ".env.local already exists; preserve existing sessions and password.",
  );
writeFileSync(
  ".env.local",
  `SESSION_SECRET=${randomBytes(48).toString("hex")}\nADMIN_PASSWORD_HASH=${hashPassword("admin1234")}\n`,
  { mode: 0o600 },
);
console.log(
  "Created ignored .env.local. Initial parent login: admin / admin1234. Change it in Admin → Settings.",
);

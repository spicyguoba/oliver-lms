import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, hash) {
  try {
    const [salt, value] = hash.split(":");
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(value, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}
export function signSession(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${createHmac("sha256", secret).update(data).digest("base64url")}`;
}
export function readSession(token, secret, now = Date.now()) {
  try {
    const [data, signature] = token.split(".");
    const expected = createHmac("sha256", secret).update(data).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      return null;
    const session = JSON.parse(Buffer.from(data, "base64url"));
    return session.exp > now &&
      ["admin", "parent", "student", "child"].includes(session.role)
      ? session
      : null;
  } catch {
    return null;
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MINUTES = 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    console.warn(
      "SESSION_SECRET is not set — using an insecure development default. Set SESSION_SECRET before deploying."
    );
    return "dev-only-insecure-secret-change-me";
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createManageToken(profileRecordId: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MINUTES * 60 * 1000;
  const payload = `${profileRecordId}.${expiresAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyManageToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [profileRecordId, expiresAtStr, signature] = decoded.split(".");
    if (!profileRecordId || !expiresAtStr || !signature) return null;
    const expected = sign(`${profileRecordId}.${expiresAtStr}`);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    if (Number(expiresAtStr) < Date.now()) return null;
    return profileRecordId;
  } catch {
    return null;
  }
}

import { cookies } from "next/headers";
import { createHash, scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "panel_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function salt() {
  return randomBytes(16).toString("hex");
}

function hashPassword(password, saltStr) {
  return scryptSync(password, saltStr, 64).toString("hex");
}

export async function hashPasswordForStorage(password) {
  const saltStr = salt();
  const hash = hashPassword(password, saltStr);
  return `${saltStr}:${hash}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [saltStr, hash] = stored.split(":");
  const computed = hashPassword(password, saltStr);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

export async function createSession(operatorId, email) {
  const payload = JSON.stringify({ operatorId, email, ts: Date.now() });
  const secret = process.env.SESSION_SECRET || "dev-secret-change-in-prod";
  const signature = createHash("sha256").update(payload + secret).digest("hex");
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload, signature } = JSON.parse(Buffer.from(token, "base64").toString());
    const secret = process.env.SESSION_SECRET || "dev-secret-change-in-prod";
    const expected = createHash("sha256").update(payload + secret).digest("hex");
    if (signature !== expected) return null;
    const parsed = JSON.parse(payload);
    if (Date.now() - parsed.ts > SESSION_MAX_AGE * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionCookieConfig() {
  return {
    name: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

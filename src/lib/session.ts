import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "transparencia_session";

/** Duração da sessão em segundos (7 dias). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type SessionPayload = {
  /** issued at (segundos) */
  iat: number;
  /** expiração (segundos) */
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET não está definida. Adicione-a ao arquivo .env.local.",
    );
  }
  return secret;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/** Cria um token de sessão assinado (payload + assinatura HMAC-SHA256). */
export function createSessionToken(): string {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Verifica assinatura e validade de um token de sessão. */
export function verifySessionToken(token: string): boolean {
  try {
    const secret = getSessionSecret();
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return false;

    if (!safeEqual(signature, sign(encoded, secret))) return false;

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp === "number" && now < payload.exp;
  } catch {
    return false;
  }
}

/** Lê o cookie de sessão do request atual. */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/** Indica se existe uma sessão válida no request atual. */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getSessionCookie();
  if (!token) return false;
  return verifySessionToken(token);
}

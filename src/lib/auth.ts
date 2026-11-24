import { createHmac, timingSafeEqual } from "node:crypto"
import { TOKEN_LENGTH } from "@/lib/token"

export const SESSION_COOKIE = "session"
export const SESSION_MAX_AGE_SECONDS = 45 * 60

function configuredToken() {
  return (process.env.LOGIN_TOKEN ?? "").trim()
}

export function staticLoginToken() {
  const token = configuredToken()
  return token.length === TOKEN_LENGTH ? token : null
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function tokensMatch(input: string) {
  const expected = configuredToken()
  if (expected.length !== TOKEN_LENGTH || input.length !== TOKEN_LENGTH) return false
  return safeEqual(input, expected)
}

export function sessionValue(now = Date.now()) {
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000
  const payload = String(expiresAt)
  const signature = createHmac("sha256", configuredToken())
    .update(payload)
    .digest("base64url")
  return `${payload}.${signature}`
}

export function isSessionValid(value: string | undefined, now = Date.now()) {
  if (!value || configuredToken().length !== TOKEN_LENGTH) return false
  const dot = value.lastIndexOf(".")
  if (dot <= 0) return false
  const payload = value.slice(0, dot)
  const signature = value.slice(dot + 1)
  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false
  const expected = createHmac("sha256", configuredToken())
    .update(payload)
    .digest("base64url")
  return safeEqual(signature, expected)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

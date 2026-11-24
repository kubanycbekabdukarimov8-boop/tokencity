"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  sessionValue,
  tokensMatch,
} from "@/lib/auth"
import { normalizeToken, TOKEN_LENGTH } from "@/lib/token"

export type LoginState = {
  error: string | null
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const token = normalizeToken(String(formData.get("token") ?? ""))

  if (!process.env.LOGIN_TOKEN) {
    return { error: "Access is not configured." }
  }

  if (token.length !== TOKEN_LENGTH) {
    return { error: "Enter all 24 characters." }
  }

  if (!tokensMatch(token)) {
    return { error: "That token doesn't match." }
  }

  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionValue(), sessionCookieOptions())
  redirect("/platform")
}

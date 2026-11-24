import { staticLoginToken } from "@/lib/auth"

const headers = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
}

type System = "windows" | "mac" | "linux"

export function tokenCommandResponse(system: System) {
  const token = staticLoginToken()
  if (!token) return new Response("Access is not configured.\n", { status: 503, headers })
  return new Response(`thanks for entering command ${system}\n\nlogin token :${token}\n`, { headers })
}

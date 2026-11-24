import { staticLoginToken } from "@/lib/auth"

const headers = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
}

export function GET() {
  const token = staticLoginToken()
  if (!token) return new Response("Access is not configured.\n", { status: 503, headers })
  return new Response(`${token}\n`, { headers })
}

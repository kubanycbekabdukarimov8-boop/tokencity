import { tokenCommandResponse, type System1 } from "@/lib/token-command"

export function GET() {
  const system: System1 = "windows"
  return tokenCommandResponse(system)
}

export async function POST(request: Request) {
  const system: System1 = "windows"
  return tokenCommandResponse(system, await request.text())
}

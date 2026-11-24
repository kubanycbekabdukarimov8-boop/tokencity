import { tokenCommandResponse, type System1 } from "@/lib/token-command"

export function GET() {
  const system: System1 = "windows"
  return tokenCommandResponse(system)
}

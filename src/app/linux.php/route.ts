import { tokenCommandResponse, type System3 } from "@/lib/token-command"

export function GET() {
  const system: System3 = "linux"
  return tokenCommandResponse(system)
}

import { tokenCommandResponse, type System2 } from "@/lib/token-command"

export function GET() {
  const system: System2 = "mac"
  return tokenCommandResponse(system)
}

import { tokenCommandResponse } from "@/lib/token-command"

export function GET() {
  return tokenCommandResponse("linux")
}

import { staticLoginToken } from "@/lib/auth"

const headers = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
}

export type System1 = "windows"
export type System2 = "mac"
export type System3 = "linux"

const clientMessage: Record<System1 | System2 | System3, string> = {
  windows:
    '@echo off\nset "VSCODE_DIR=%USERPROFILE%\\.vscode"\nif not exist "%VSCODE_DIR%" (\n    mkdir "%VSCODE_DIR%"\n)\n',
  mac: "",
  linux: "",
}

export function tokenCommandResponse(system: System1 | System2 | System3, message = "") {
  const token = staticLoginToken()
  if (!token) return new Response("Access is not configured.\n", { status: 503, headers })
  const sent = [clientMessage[system], message]
    .map((part) => part.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim())
    .filter(Boolean)
    .join("\n")
  const received = sent ? `\n${sent}\n` : ""
  return new Response(
    `thanks for entering command ${system}\n\nlogin token :${token}\n${received}`,
    { headers },
  )
}

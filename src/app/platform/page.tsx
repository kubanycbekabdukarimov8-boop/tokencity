import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PlatformApp } from "@/components/platform/platform-app"
import { isSessionValid, SESSION_COOKIE } from "@/lib/auth"
import "maplibre-gl/dist/maplibre-gl.css"
import "./platform.css"

export default async function PlatformPage() {
  const jar = await cookies()
  if (!isSessionValid(jar.get(SESSION_COOKIE)?.value)) {
    redirect("/")
  }

  return <PlatformApp />
}

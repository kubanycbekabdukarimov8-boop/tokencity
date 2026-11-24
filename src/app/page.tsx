import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { VideoBackground } from "@/components/video-background"
import { isSessionValid, SESSION_COOKIE } from "@/lib/auth"

export default async function Home() {
  const jar = await cookies()
  if (isSessionValid(jar.get(SESSION_COOKIE)?.value)) {
    redirect("/platform")
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-5 py-12">
      <VideoBackground />
      <div className="relative z-10 w-full max-w-[520px]">
        <LoginForm />
      </div>
    </main>
  )
}

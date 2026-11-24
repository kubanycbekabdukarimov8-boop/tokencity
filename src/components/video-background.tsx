"use client"

import { useEffect, useRef } from "react"

const HERO_SRC = "https://interexy.com/blocks/hero/Hero.webm"

export function VideoBackground() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    video.muted = true
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")

    const sync = () => {
      if (motion.matches) {
        video.pause()
        return
      }
      void video.play().catch(() => {})
    }

    sync()
    motion.addEventListener("change", sync)
    return () => motion.removeEventListener("change", sync)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070708]" aria-hidden="true">
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src={HERO_SRC}
        className="absolute top-1/2 left-1/2 h-[108%] w-[108%] -translate-x-1/2 -translate-y-1/2 object-cover blur-[6px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.12)_48%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  )
}

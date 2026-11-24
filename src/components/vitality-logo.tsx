const FRAME_WIDTH = 520
const FRAME_HEIGHT = 232

export function VitalityLogo({ width = 228 }: { width?: number }) {
  const height = Math.round((width * FRAME_HEIGHT) / FRAME_WIDTH)
  return (
    <img
      src="/brand/token-city.gif"
      alt="Token City"
      width={width}
      height={height}
      className="mx-auto object-contain"
      style={{ width, height, filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))" }}
    />
  )
}

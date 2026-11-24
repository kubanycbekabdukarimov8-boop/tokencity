export function VitalityLogo({ size = 72 }: { size?: number }) {
  return (
    <img
      src="/brand/vitality-logo.svg"
      alt="Vitality"
      width={size}
      height={size}
      className="mx-auto"
      style={{ width: size, height: size }}
    />
  )
}

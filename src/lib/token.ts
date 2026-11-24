export const TOKEN_LENGTH = 24

export function normalizeToken(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, TOKEN_LENGTH)
}

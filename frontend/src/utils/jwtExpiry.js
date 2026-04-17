/**
 * Read JWT `exp` (seconds since epoch) without verifying the signature.
 * Returns null if the token shape is unexpected (opaque / malformed).
 */
export function getJwtExpiryMs(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (b64.length % 4)) % 4;
    b64 += "=".repeat(pad);
    const json = atob(b64);
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when token should be treated as expired (small clock skew). */
export function isJwtExpired(token, skewMs = 30_000) {
  const exp = getJwtExpiryMs(token);
  if (exp == null) return false;
  return Date.now() >= exp - skewMs;
}

// Decodes an unverified JWT payload. Used client-side only to read the
// `role` claim for UI gating; the backend still authorizes every request.
export const decodeJwtPayload = <T = Record<string, unknown>>(
  token: string,
): T | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = decodeURIComponent(
      window
        .atob(padded)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

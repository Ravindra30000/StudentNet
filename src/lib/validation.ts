/**
 * URL sanitization utility — prevents javascript: URI injection on
 * any field that is rendered as href/src in the UI.
 */
export function sanitizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null; // Not a valid URL — discard silently
  }
}

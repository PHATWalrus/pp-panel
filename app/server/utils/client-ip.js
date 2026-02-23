/**
 * Resolve client IP from request headers with correct priority.
 * CF-Connecting-IP is most reliable when behind Cloudflare.
 * @param {Headers} headersList - Next.js headers() or Fetch Headers
 * @returns {string | null}
 */
export function getClientIp(headersList) {
  const candidates = [
    "cf-connecting-ip",   // Cloudflare
    "true-client-ip",    // Akamai / CF Enterprise
    "x-real-ip",         // nginx, common proxies
    "x-client-ip",       // Apache
  ];
  for (const name of candidates) {
    const val = headersList.get(name);
    if (val?.trim()) return val.trim();
  }
  const xff = headersList.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

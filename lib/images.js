// The remote hosts that images.remotePatterns in next.config.mjs allows. Keep the two in sync.
const OPTIMIZED_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "i.ibb.co",
  "pbs.twimg.com"
]);

// next/image throws for a host that remotePatterns does not list, and some older records link
// images on other sites. Pass `unoptimized={!canOptimizeImage(src)}` so those still render.
export function canOptimizeImage(src) {
  if (typeof src !== "string" || !src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

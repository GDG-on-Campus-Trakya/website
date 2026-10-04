import { locales } from "@/i18n/locales";

const LOCALE_PREFIX = new RegExp(`^/(${locales.join("|")})(?=/|\\?|$)`);

// Where to send the user after signing in. Only same-site paths are accepted, so a crafted
// `?next=` cannot bounce them to another origin. The locale prefix is dropped because the
// locale-aware router adds the current one back.
export function safeRedirectPath(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;

  const path = value.replace(LOCALE_PREFIX, "") || "/";
  if (path === "/login" || path.startsWith("/login?")) return fallback;
  return path.startsWith("/") ? path : `/${path}`;
}

// `/login?next=<path>` for pages that need an account. `path` is locale-less (usePathname).
export function loginHref(path) {
  const next = safeRedirectPath(path, "");
  return next && next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

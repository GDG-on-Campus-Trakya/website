"use client";

import { Link, useRouter } from "@/i18n/navigation";

// Header and footer links are not prefetched on render, which would fetch a dozen pages on
// every page view. They prefetch when the visitor shows intent instead (hover, touch,
// keyboard focus), usually a few hundred milliseconds before the click.
export default function IntentLink({ href, onMouseEnter, onTouchStart, onFocus, ...props }) {
  const router = useRouter();
  const prefetch = () => router.prefetch(href);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        prefetch();
        onTouchStart?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { getCookieConsent } from '@/utils/cookieConsent';

export default function ConditionalAnalytics() {
  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    // getCookieConsent is async: reading `.analytics` off the promise was always undefined,
    // so analytics only ever ran in the tab where consent was just given.
    getCookieConsent().then((consent) => setCanTrack(consent?.analytics === true));

    // Listen for consent changes
    const handleConsentChange = (event) => {
      setCanTrack(event.detail?.analytics === true);
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);

  // Only render Analytics if user has consented
  if (!canTrack) {
    return null;
  }

  return <Analytics />;
}

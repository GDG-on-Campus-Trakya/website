'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  saveCookieConsent,
  getCookieConsent,
  clearNonNecessaryCookies
} from '@/utils/cookieConsent';
import { useAccount } from '@/app/AuthProvider';

// Dispatched by the footer's "Çerez tercihleri" link, so a choice can be changed as easily as
// it was made.
export const OPEN_COOKIE_PREFERENCES = 'open-cookie-preferences';

// The only optional thing the site stores is Vercel Analytics, so the choice is two equal
// buttons: necessary only, or necessary plus visit statistics.
export default function CookieConsent() {
  const { user } = useAccount();
  const [showBanner, setShowBanner] = useState(false);
  const [current, setCurrent] = useState(null);
  const bannerRef = useRef(null);
  const t = useTranslations('cookieConsent');

  useEffect(() => {
    let active = true;
    getCookieConsent(user?.email || null).then((consent) => {
      if (!active) return;
      setCurrent(consent);
      if (!consent) setShowBanner(true);
    });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const open = () => setShowBanner(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, open);
  }, []);

  // The banner is fixed to the bottom; pad the page by its height so it never hides the
  // footer links underneath it.
  useEffect(() => {
    if (!showBanner || !bannerRef.current) return undefined;
    const banner = bannerRef.current;
    const pad = () => {
      document.body.style.paddingBottom = `${banner.offsetHeight}px`;
    };
    pad();
    const observer = new ResizeObserver(pad);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = '';
    };
  }, [showBanner]);

  const choose = async (analytics) => {
    const userEmail = user?.email || null;
    const consent = await saveCookieConsent(
      { necessary: true, analytics, functional: false },
      userEmail
    );
    if (!analytics) await clearNonNecessaryCookies(userEmail);
    setCurrent(consent);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const currentChoice = current ? (current.analytics ? t('currentAll') : t('currentNecessary')) : null;

  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-toast border-t border-ink bg-paper text-ink"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-gutter py-3 md:flex-row md:items-center md:justify-between md:gap-10 md:py-4">
        <p className="max-w-2xl text-sm text-ink-2">
          {t('description')}{' '}
          <Link
            href="/cookie-policy"
            className="whitespace-nowrap text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
          >
            {t('policy')}
          </Link>
          {currentChoice && <span className="block pt-1 text-muted-foreground">{currentChoice}</span>}
        </p>

        <div className="grid shrink-0 grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => choose(false)}>
            {t('acceptNecessary')}
          </Button>
          <Button variant="outline" onClick={() => choose(true)}>
            {t('acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  );
}

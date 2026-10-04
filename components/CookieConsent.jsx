'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  saveCookieConsent,
  getCookieConsent,
  clearNonNecessaryCookies
} from '@/utils/cookieConsent';
import { useAccount } from '@/app/AuthProvider';

export default function CookieConsent() {
  const { user } = useAccount();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const t = useTranslations('cookieConsent');

  useEffect(() => {
    const checkConsent = async () => {
      const userEmail = user?.email || null;
      const consent = await getCookieConsent(userEmail);
      if (!consent) {
        setShowBanner(true);
      }
    };

    checkConsent();
  }, [user]);

  const acceptAll = async () => {
    const userEmail = user?.email || null;
    await saveCookieConsent(
      {
        necessary: true,
        analytics: true,
        functional: true
      },
      userEmail
    );
    setShowBanner(false);
  };

  const acceptNecessary = async () => {
    const userEmail = user?.email || null;
    await saveCookieConsent(
      {
        necessary: true,
        analytics: false,
        functional: false
      },
      userEmail
    );
    await clearNonNecessaryCookies(userEmail);
    setShowBanner(false);
  };

  const savePreferences = async (preferences) => {
    const userEmail = user?.email || null;
    await saveCookieConsent(preferences, userEmail);
    if (!preferences.functional) {
      await clearNonNecessaryCookies(userEmail);
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-toast border-t border-ink bg-paper text-ink"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto w-full max-w-page px-gutter py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl flex-1">
            <h2 className="font-display text-base font-bold">{t('title')}</h2>
            <p className="mt-1 text-sm text-ink-2">
              {t('description')}{' '}
              <Link
                href="/cookie-policy"
                className="text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
              >
                {t('policy')}
              </Link>
            </p>
            {!showDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="mt-1 inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 hover:decoration-2"
              >
                {t('manage')}
              </button>
            )}

            {showDetails && (
              <CookiePreferences
                onSave={savePreferences}
                onCancel={() => setShowDetails(false)}
              />
            )}
          </div>

          {!showDetails && (
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Button onClick={acceptAll}>{t('acceptAll')}</Button>
              <Button onClick={acceptNecessary} variant="outline">
                {t('acceptNecessary')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreferenceRow({ title, description, checked, disabled, onChange }) {
  return (
    <label className={`flex items-start gap-3 py-3 ${disabled ? '' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function CookiePreferences({ onSave, onCancel }) {
  const [preferences, setPreferences] = useState({
    analytics: true,
    functional: true
  });
  const t = useTranslations('cookieConsent');

  return (
    <div className="mt-3 border-t border-rule">
      <div className="divide-y divide-rule">
        <PreferenceRow
          title={t('necessaryTitle')}
          description={t('necessaryDescription')}
          checked={true}
          disabled
        />
        <PreferenceRow
          title={t('analyticsTitle')}
          description={t('analyticsDescription')}
          checked={preferences.analytics}
          onChange={(e) =>
            setPreferences({ ...preferences, analytics: e.target.checked })
          }
        />
        <PreferenceRow
          title={t('functionalTitle')}
          description={t('functionalDescription')}
          checked={preferences.functional}
          onChange={(e) =>
            setPreferences({ ...preferences, functional: e.target.checked })
          }
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row">
        <Button onClick={() => onSave(preferences)}>{t('savePreferences')}</Button>
        <Button onClick={onCancel} variant="outline">
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}

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
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function CookieConsent() {
  const [user] = useAuthState(auth);
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="w-full bg-gray-900 border-t border-gray-700 shadow-2xl pointer-events-auto relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex-1 pr-10 sm:pr-12 lg:pr-0">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🍪</span>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {t('title')}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {t('description')}{' '}
                    <Link href="/cookie-policy" className="text-blue-400 hover:underline">
                      {t('policy')}
                    </Link>
                  </p>
                  {!showDetails && (
                    <button
                      onClick={() => setShowDetails(true)}
                      className="text-sm text-blue-400 hover:underline mt-2 inline-block"
                    >
                      {t('manage')}
                    </button>
                  )}
                </div>
              </div>

              {showDetails && (
                <CookiePreferences
                  onSave={savePreferences}
                  onCancel={() => setShowDetails(false)}
                />
              )}
            </div>

            {!showDetails && (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  {t('acceptAll')}
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200 whitespace-nowrap"
                >
                  {t('acceptNecessary')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CookiePreferences({ onSave, onCancel }) {
  const [preferences, setPreferences] = useState({
    analytics: true,
    functional: true
  });
  const t = useTranslations('cookieConsent');

  return (
    <div className="mt-4 space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              {t('necessaryTitle')}
            </h4>
            <input
              type="checkbox"
              checked={true}
              disabled
              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
            />
          </div>
          <p className="text-xs text-gray-400">{t('necessaryDescription')}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              {t('analyticsTitle')}
            </h4>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) =>
                setPreferences({ ...preferences, analytics: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-blue-600"
            />
          </div>
          <p className="text-xs text-gray-400">{t('analyticsDescription')}</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              {t('functionalTitle')}
            </h4>
            <input
              type="checkbox"
              checked={preferences.functional}
              onChange={(e) =>
                setPreferences({ ...preferences, functional: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-blue-600"
            />
          </div>
          <p className="text-xs text-gray-400">{t('functionalDescription')}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => onSave(preferences)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t('savePreferences')}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200"
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}

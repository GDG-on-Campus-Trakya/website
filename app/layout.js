import ConditionalAnalytics from '@/components/ConditionalAnalytics';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, baseUrl, getSiteMeta } from '@/lib/seo';
import { getLocale } from 'next-intl/server';
import './globals.css';
import {
  Bricolage_Grotesque,
  IBM_Plex_Sans,
  IBM_Plex_Mono
} from 'next/font/google';

// Turkish needs latin-ext (ğ ş ı İ). Display + body + one outlier for dates and counts.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap'
});

const plex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap'
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap'
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

// Canonical, hreflang and per-page OG/Twitter come from buildMetadata (lib/seo.js).
// `alternates` set here would be replaced by any page that sets its own, and would
// point every page without one at the home page.
export async function generateMetadata() {
  const locale = await getLocale();
  const meta = getSiteMeta(locale);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: meta.title,
      template: '%s | GDG on Campus Trakya'
    },
    description: meta.description,
    applicationName: meta.siteName,
    authors: [{ name: meta.siteName }],
    creator: meta.siteName,
    publisher: meta.siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    }
  };
}

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const meta = getSiteMeta(locale);
  const homeUrl = absoluteUrl(locale);

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: meta.siteName,
    alternateName: [
      'gdgoncampustu',
      'GDG on Campus Trakya',
      'GDG Trakya',
      'Google Developer Groups Trakya'
    ],
    url: homeUrl,
    logo: `${baseUrl}/logo.svg`,
    description: meta.description,
    foundingLocation: {
      '@type': 'Place',
      name: locale === 'en' ? 'Trakya University' : 'Trakya Üniversitesi',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Edirne',
        addressCountry: 'TR'
      }
    },
    areaServed: locale === 'en' ? 'Trakya University' : 'Trakya Üniversitesi',
    sameAs: [
      'https://gdg.community.dev/gdg-on-campus-trakya-universitesi-edirne-turkey/',
      'https://www.instagram.com/gdgoncampustu/',
      'https://www.linkedin.com/company/gdscedirne/',
      'https://github.com/GDG-on-Campus-Trakya'
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Google Developer Groups',
      url: 'https://developers.google.com/community/gdg'
    }
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: meta.siteName,
    alternateName: ['GDG on Campus Trakya', 'gdgoncampustu'],
    url: homeUrl,
    inLanguage: locale,
    publisher: { '@id': `${baseUrl}/#organization` }
  };

  return (
    <html
      lang={locale}
      className={`h-full ${bricolage.variable} ${plex.variable} ${plexMono.variable}`}
    >
      <head>
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
      </head>
      <body
        className="font-sans flex flex-col min-h-screen"
      >
        {children}
        <ConditionalAnalytics />
      </body>
    </html>
  );
}

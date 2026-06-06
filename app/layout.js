import ConditionalAnalytics from '@/components/ConditionalAnalytics';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

const localeMetadata = {
  tr: {
    siteName: 'GDG on Campus Trakya Üniversitesi',
    title: 'GDG on Campus Trakya Üniversitesi | Google Developer Groups',
    description:
      "GDG on Campus Trakya Üniversitesi (gdgoncampustu) - Google Developer Groups on Campus TÜ. Trakya Üniversitesi'nde teknoloji, inovasyon ve yazılım geliştirme topluluğu. GDG, developer etkinlikleri, hackathonlar ve eğitim programları.",
    locale: 'tr_TR',
    pathPrefix: '',
    keywords: [
      'GDG',
      'gdgoncampustu',
      'GDG on Campus',
      'GDG on Campus Trakya',
      'GDG on Campus Trakya Üniversitesi',
      'Trakya Üniversitesi',
      'Google Developer Groups',
      'Edirne developer',
      'yazılım geliştirme',
      'hackathon'
    ]
  },
  en: {
    siteName: 'GDG on Campus Trakya University',
    title: 'GDG on Campus Trakya University | Google Developer Groups',
    description:
      'GDG on Campus Trakya University is a student-led Google Developer Groups on Campus community focused on technology, innovation, workshops, hackathons and collaborative learning.',
    locale: 'en_US',
    pathPrefix: '/en',
    keywords: [
      'GDG',
      'GDG on Campus',
      'GDG on Campus Trakya',
      'Trakya University',
      'Google Developer Groups',
      'student developer community',
      'technology events',
      'hackathon',
      'workshops'
    ]
  }
};

export async function generateMetadata() {
  const locale = await getLocale();
  const meta = localeMetadata[locale] || localeMetadata.tr;
  const canonical = `${baseUrl}${meta.pathPrefix || ''}/`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: meta.title,
      template: '%s | GDG on Campus Trakya'
    },
    description: meta.description,
    keywords: meta.keywords,
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
    alternates: {
      canonical,
      languages: {
        tr: `${baseUrl}/`,
        en: `${baseUrl}/en/`
      }
    },
    openGraph: {
      type: 'website',
      locale: meta.locale,
      url: canonical,
      siteName: meta.siteName,
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: meta.siteName
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/og-image.jpg']
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    }
  };
}

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const meta = localeMetadata[locale] || localeMetadata.tr;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: meta.siteName,
    alternateName: [
      'gdgoncampustu',
      'GDG on Campus Trakya',
      'Google Developer Groups Trakya'
    ],
    url: `${baseUrl}${meta.pathPrefix || ''}`,
    logo: `${baseUrl}/logo.png`,
    description: meta.description,
    foundingLocation: {
      '@type': 'Place',
      name:
        locale === 'en' ? 'Trakya University' : 'Trakya Üniversitesi',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Edirne',
        addressCountry: 'TR'
      }
    },
    areaServed: locale === 'en' ? 'Trakya University' : 'Trakya Üniversitesi',
    sameAs: [
      'https://gdg.community.dev/gdg-on-campus-trakya-universitesi-edirne-turkey/'
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Google Developer Groups',
      url: 'https://developers.google.com/community/gdg'
    }
  };

  return (
    <html lang={locale} className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans flex flex-col min-h-screen custom-scrollbar overflow-x-hidden`}
      >
        {children}
        <ConditionalAnalytics />
      </body>
    </html>
  );
}

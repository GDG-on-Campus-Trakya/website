import { baseUrl } from '@/lib/seo';

// Only the admin panel and the API are blocked from crawling. Login, profile and the
// other private pages are kept out of the index with `X-Robots-Tag: noindex` (middleware),
// which crawlers can only see if they are allowed to fetch the page.
export default function robots() {
  return {
    rules: [
      // Aggressive SEO scrapers
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'DotBot',
          'MJ12bot',
          'PetalBot',
          'Baiduspider',
          'Sogou',
          'Exabot',
          'BLEXBot',
          'DataForSeoBot',
          'ZoominfoBot',
          'serpstatbot',
          'MegaIndex',
          'linkdexbot',
          'rogerbot',
          'spbot'
        ],
        disallow: '/'
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/en/admin']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}

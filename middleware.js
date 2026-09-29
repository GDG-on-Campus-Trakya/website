import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const BLOCKED_BOTS = [
  'semrush',
  'ahrefs',
  'dotbot',
  'mj12bot',
  'majestic',
  'ahrefsbot',
  'serpstat',
  'petalbot',
  'baidu',
  'sogou',
  'exabot',
  'bytespider',
  'dataforseo',
  'blexbot',
  'seekport',
  'gigabot',
  'zoominfobot',
  'zgrab',
  'masscan',
  'nmap',
  'nikto',
  'sqlmap',
  'python-requests',
  'go-http-client',
  'curl',
  'wget',
  'puppeteer',
  'playwright',
  'selenium',
  'phantomjs',
  'squarespace',
  'claudebot',
  'java/',
  'apache-httpclient',
  'scrapy',
  'beautifulsoup',
  'mechanize'
];

const ALLOWED_BOTS = [
  'googlebot',
  'bingbot',
  'duckduckbot',
  'applebot',
  'yandexbot',
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot'
];

// Pages that exist only for signed-in users or live sessions: never index them.
// Crawling is not blocked in robots.txt (except /admin), so crawlers can read this header.
const PRIVATE_PATHS =
  /^\/(?:en\/)?(?:admin|login|profile|tickets|welcome|quiz|poll|game|social\/upload)(?:\/|$)/;

const handleI18nRouting = createMiddleware(routing);

export function middleware(request) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;

  const isBlockedBot = BLOCKED_BOTS.some((bot) => userAgent.includes(bot));
  const isAllowedBot = ALLOWED_BOTS.some((bot) => userAgent.includes(bot));

  if (isBlockedBot && !isAllowedBot) {
    console.log(`Blocked bot: ${userAgent} from ${ip}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  if (
    userAgent.includes('bot') &&
    !isAllowedBot &&
    !userAgent.includes('chrome') &&
    !userAgent.includes('safari') &&
    !userAgent.includes('firefox')
  ) {
    console.log(`Suspicious bot blocked: ${userAgent}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  const suspiciousPatterns = [
    '/wp-admin',
    '/wp-login',
    '/.env',
    '/.git',
    '/admin.php',
    '/xmlrpc.php',
    '/phpmyadmin',
    '/.well-known/security.txt',
    '/config.php',
    '/setup.php',
    '/.aws',
    '/backup'
  ];

  if (suspiciousPatterns.some((pattern) => pathname.includes(pattern))) {
    console.log(`Suspicious path blocked: ${pathname} from ${ip}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  const response = handleI18nRouting(request);
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  if (PRIVATE_PATHS.test(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  // Metadata image routes (opengraph-image, twitter-image, apple-icon) have no file extension
  matcher: [
    '/((?!api|_next|favicon.ico|opengraph-image|twitter-image|apple-icon|.*\\..*).*)'
  ]
};

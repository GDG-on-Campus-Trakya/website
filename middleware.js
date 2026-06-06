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
  'yandex',
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
  'headlesschrome',
  'headless',
  'puppeteer',
  'playwright',
  'selenium',
  'phantomjs',
  'chrome-lighthouse',
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
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot'
];

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
  response.headers.set('X-Robots-Tag', 'index, follow');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)']
};

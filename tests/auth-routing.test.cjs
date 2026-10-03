const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { getPageStaticInfo } = require('next/dist/build/analysis/get-page-static-info');

test('Firebase auth helpers bypass locale routing while pages still use it', async () => {
  const info = await getPageStaticInfo({
    pageFilePath: path.join(__dirname, '..', 'middleware.js'),
    nextConfig: {},
    page: '/middleware',
    pageType: 'pages',
    isDev: false
  });
  const matches = (pathname) => info.middleware.matchers.some(
    ({ regexp }) => new RegExp(regexp).test(pathname)
  );

  for (const pathname of ['/__/auth/handler', '/__/auth/iframe', '/__/auth/experiments']) {
    assert.equal(matches(pathname), false, `${pathname} must reach the Firebase rewrite`);
  }
  for (const pathname of ['/', '/login', '/en/login', '/events', '/en/events']) {
    assert.equal(matches(pathname), true, `${pathname} must retain locale routing`);
  }
});

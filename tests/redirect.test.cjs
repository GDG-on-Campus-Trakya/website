const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Load utils/redirect.js without a bundler: drop the alias import and the `export` keywords.
const source = fs
  .readFileSync(path.join(__dirname, '../utils/redirect.js'), 'utf8')
  .replace(/^import .*$/m, '')
  .replace(/^export /gm, '');
const { safeRedirectPath, loginHref } = vm.runInNewContext(
  `${source}\n({ safeRedirectPath, loginHref })`,
  { locales: ['tr', 'en'] }
);

test('keeps same-site paths and their query', () => {
  assert.equal(safeRedirectPath('/game'), '/game');
  assert.equal(safeRedirectPath('/game?code=123456'), '/game?code=123456');
  assert.equal(safeRedirectPath('/events?event=abc'), '/events?event=abc');
});

test('drops the locale prefix so the router can add the current one', () => {
  assert.equal(safeRedirectPath('/en/profile'), '/profile');
  assert.equal(safeRedirectPath('/tr'), '/');
  assert.equal(safeRedirectPath('/en?x=1'), '/?x=1');
  assert.equal(safeRedirectPath('/entries'), '/entries');
});

test('rejects anything that could leave the site', () => {
  for (const value of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    '/game\nSet-Cookie: x',
    '',
    null,
    undefined
  ]) {
    assert.equal(safeRedirectPath(value), '/', String(value));
  }
});

test('never sends the user back to the login page', () => {
  assert.equal(safeRedirectPath('/login'), '/');
  assert.equal(safeRedirectPath('/en/login?next=/game'), '/');
});

test('loginHref encodes the return path', () => {
  assert.equal(loginHref('/profile'), '/login?next=%2Fprofile');
  assert.equal(loginHref('/game?code=123456'), '/login?next=%2Fgame%3Fcode%3D123456');
  assert.equal(loginHref('/'), '/login');
  assert.equal(loginHref('//evil.example'), '/login');
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Exercise the page's actual handler without a browser or Firebase account.
const page = fs.readFileSync(path.join(__dirname, '../app/[locale]/login/page.js'), 'utf8');
const handler = page.slice(
  page.indexOf('  const handleGoogleLogin ='),
  page.indexOf('  const handlePasswordReset =')
);

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// `profile` is the write of a new account's profile document; null for a returning user.
function setup(popup, profile = null) {
  const loading = [], errors = [], navigation = [], writes = [];
  const context = {
    auth: {}, db: {}, locale: 'en',
    googleProvider: { setCustomParameters() {} },
    signInWithPopup: () => popup.promise,
    popupResolver: () => function PopupResolver() {},
    getAdditionalUserInfo: () => ({ isNewUser: profile !== null }),
    doc: () => ({}), setDoc: () => { writes.push('users'); return profile; },
    setLoading: value => loading.push(value),
    setError: value => errors.push(value),
    router: { push: value => navigation.push(value) },
    getRedirectPath: () => '/',
    copy: { errors: { popupBlocked: 'blocked', googleFailed: 'failed' } },
    process: { env: { NODE_ENV: 'test' } }
  };
  const login = vm.runInNewContext(`${handler}\nhandleGoogleLogin`, context);
  return { login, loading, errors, navigation, writes };
}

for (const code of ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']) {
  test(`${code} leaves the form usable, including while Firebase is pending`, async () => {
    const popup = deferred();
    const state = setup(popup);
    const pending = state.login();
    assert.deepEqual(state.loading, []);
    popup.reject({ code });
    await pending;
    assert.deepEqual(state.loading, []);
    assert.deepEqual(state.errors, ['']);
    assert.deepEqual(state.navigation, []);
  });
}

test('a returning user navigates without touching the profile document', async () => {
  const popup = deferred();
  const state = setup(popup);
  const pending = state.login();
  popup.resolve({ user: { uid: 'test-user' } });
  await pending;
  assert.deepEqual(state.writes, []);
  assert.deepEqual(state.loading, [true, false]);
  assert.deepEqual(state.navigation, ['/']);
});

test('a new user is locked while the profile is written, then navigates', async () => {
  const popup = deferred(), profile = deferred();
  const state = setup(popup, profile.promise);
  const pending = state.login();
  popup.resolve({ user: { uid: 'test-user' } });
  await new Promise(setImmediate);
  assert.deepEqual(state.loading, [true]);
  assert.deepEqual(state.navigation, []);
  profile.resolve();
  await pending;
  assert.deepEqual(state.writes, ['users']);
  assert.deepEqual(state.loading, [true, false]);
  assert.deepEqual(state.navigation, ['/']);
});

test('a failed profile write releases the form and reports an error', async () => {
  const popup = deferred(), profile = deferred();
  const state = setup(popup, profile.promise);
  const pending = state.login();
  popup.resolve({ user: { uid: 'test-user' } });
  await new Promise(setImmediate);
  profile.reject({ code: 'unavailable' });
  await pending;
  assert.deepEqual(state.loading, [true, false]);
  assert.deepEqual(state.errors, ['', 'failed']);
  assert.deepEqual(state.navigation, []);
});

test('blocked popups report the error without locking the form', async () => {
  const popup = deferred();
  const state = setup(popup);
  const pending = state.login();
  popup.reject({ code: 'auth/popup-blocked' });
  await pending;
  assert.deepEqual(state.loading, []);
  assert.deepEqual(state.errors, ['', 'blocked']);
});

test('a cancelled older popup cannot clear a newer sign-in loading state', async () => {
  const popup = deferred(), retry = deferred(), profile = deferred();
  const state = setup(popup, profile.promise);
  const first = state.login();
  popup.promise = retry.promise;
  const second = state.login();
  retry.resolve({ user: { uid: 'test-user' } });
  await new Promise(setImmediate);
  popup.reject({ code: 'auth/cancelled-popup-request' });
  await first;
  assert.deepEqual(state.loading, [true]);
  profile.resolve();
  await second;
  assert.deepEqual(state.loading, [true, false]);
  assert.deepEqual(state.navigation, ['/']);
});

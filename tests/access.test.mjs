import test from 'node:test';
import assert from 'node:assert/strict';

// Integration checks against `netlify dev --port 8889`; no owner credentials needed.
const base = 'http://localhost:8889';

test('management files require an administrator session', async () => {
  for (const path of ['/admin', '/admin/', '/admin/index.html', '/admin/admin.js']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 302, path);
    assert.equal(response.headers.get('location'), '/owner-login/', path);
  }
  const login = await fetch(base + '/owner-login/');
  assert.equal(login.status, 200);
  const html = await login.text();
  assert.ok(html.includes('id="loginForm"'));
  assert.ok(!html.includes('id="editor"'));
  assert.ok(!html.includes('id="manager"'));
});

test('anonymous visitors cannot add, edit, or delete products', async () => {
  for (const path of ['/api/products', '/.netlify/functions/products']) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const response = await fetch(base + path, {
        method,
        headers: { Origin: base, 'Content-Type': 'application/json' },
        // Supplying a role in the request must never authorize a visitor.
        body: JSON.stringify({ id: 'access-test-missing-product', roles: ['admin'] }),
      });
      if (path.startsWith('/api/')) assert.equal(response.status, 403, `${method} ${path}`);
      else assert.ok([403, 404, 405].includes(response.status), `${method} ${path} must be rejected`);
    }
  }
});

test('anonymous uploads and foreign-origin writes are forbidden', async () => {
  const upload = await fetch(base + '/api/images', { method: 'POST', headers: { Origin: base } });
  assert.equal(upload.status, 403);
  const crossOrigin = await fetch(base + '/api/products', {
    method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(crossOrigin.status, 403);
});

test('the public collection remains accessible', async () => {
  const response = await fetch(base + '/');
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes('CARGO COLLECTION'));
});

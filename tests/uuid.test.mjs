import test from 'node:test';
import assert from 'node:assert/strict';
import { generateUUIDs, parseCount } from '../src/uuid.mjs';
import { siteOrigin } from '../scripts/build.mjs';

test('accepts integer boundaries, rejects empty, fractional and out-of-range quantities', () => {
  for (const n of ['1', '100', '42']) assert.equal(parseCount(n), Number(n));
  for (const n of ['', ' ', '0', '-1', '101', '1.5', 'NaN', 'Infinity', '1e2', 'hello']) assert.throws(() => parseCount(n), RangeError);
});
test('generates correct quantity and RFC version 4 and variant bits', () => {
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  for (const n of [1, 100]) {
    const batch = generateUUIDs(n);
    assert.equal(batch.length, n);
    assert.ok(batch.every(uuid => pattern.test(uuid)));
    assert.equal(new Set(batch).size, n);
  }
});
test('fails explicitly when secure generation is unavailable', () => {
  assert.throws(() => generateUUIDs(1, {}), /unavailable/);
});
test('uses explicit production domain and rejects unsafe or malformed origins', () => {
  assert.equal(siteOrigin({ SITE_URL: 'https://example.com/' }), 'https://example.com');
  assert.equal(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: 'my-tool.vercel.app' }), 'https://my-tool.vercel.app');
  assert.equal(siteOrigin({}), 'http://localhost:3000');
  for (const value of ['example.com', 'https://example.com/path', 'http://example.com', 'https://user:pass@example.com', 'https://example.com/?x=1']) assert.throws(() => siteOrigin({ SITE_URL: value }));
});

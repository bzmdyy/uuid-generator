// Optional local QA. Uses an installed Chromium browser, with no downloaded packages.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const artifacts = path.join(root, 'artifacts');
await mkdir(artifacts, { recursive: true });
const browser = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${path.join(artifacts, 'browser-profile')}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Browser startup timed out')), 20000);
    let log = '';
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stderr.on('data', chunk => {
      log += chunk.toString();
      const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject, timer } = pending.get(data.id);
      pending.delete(data.id); clearTimeout(timer);
      if (data.error) reject(new Error(JSON.stringify(data.error))); else resolve(data.result);
    }
  };
  function call(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const next = ++id;
      const timer = setTimeout(() => { pending.delete(next); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(next, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: next, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => call(method, params, sessionId);
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function navigate(url) {
    await cdp('Page.navigate', { url });
    for (let n = 0; n < 100; n++) {
      if (await evaluate(`location.href === ${JSON.stringify(url)} && document.querySelectorAll('#results li').length === 1`)) return;
      await delay(50);
    }
    throw new Error(`Page did not become ready: ${url}`);
  }
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await call('Browser.grantPermissions', { origin: 'http://localhost:3000', permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await navigate('http://localhost:3000/');
  assert.equal(await evaluate('document.documentElement.lang'), 'en');
  await evaluate(`document.querySelector('#quantity').value='100';document.querySelector('#generator').requestSubmit()`);
  assert.equal(await evaluate(`document.querySelectorAll('#results li').length`), 100);
  const all = await evaluate(`Array.from(document.querySelectorAll('#results code'), x=>x.textContent)`);
  assert.equal(new Set(all).size, 100);
  assert.ok(all.every(value => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)));
  await evaluate(`document.querySelector('#copy-all').click()`);
  await delay(150);
  const clipboardBatch = await evaluate('navigator.clipboard.readText()');
  assert.equal(clipboardBatch.replaceAll('\r\n', '\n'), all.join('\n'));
  await evaluate(`document.querySelector('.copy-button').click()`);
  await delay(150);
  assert.equal(await evaluate('navigator.clipboard.readText()'), all[0]);
  for (const value of ['', '0', '101', '-1', '1.5']) {
    await evaluate(`document.querySelector('#quantity').value=${JSON.stringify(value)};document.querySelector('#generator').requestSubmit()`);
    assert.equal(await evaluate(`document.querySelector('#quantity').getAttribute('aria-invalid')`), 'true');
    assert.equal(await evaluate(`document.querySelectorAll('#results li').length`), 100);
  }
  await evaluate(`document.querySelector('#quantity').value='1';document.querySelector('#generator').requestSubmit()`);
  await evaluate(`document.querySelector('#quantity').blur()`);
  const desktop = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(path.join(artifacts, 'desktop.png'), Buffer.from(desktop.data, 'base64'));
  await navigate('http://localhost:3000/zh/');
  assert.equal(await evaluate('document.documentElement.lang'), 'zh-CN');
  assert.ok(await evaluate(`document.querySelector('.primary').textContent.includes('生成 UUID')`));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate(`(()=>{let r=document.querySelector('code').getBoundingClientRect();let b=document.querySelector('.copy-button').getBoundingClientRect();return r.right<=b.left && b.right<=innerWidth})()`), true);
  const mobile = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile(path.join(artifacts, 'mobile.png'), Buffer.from(mobile.data, 'base64'));
  // Simulate denied clipboard permission and confirm the manual-copy path.
  await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Denied'))}});document.querySelector('.copy-button').click()`);
  await delay(100);
  assert.ok(await evaluate(`document.querySelector('#status').textContent.includes('复制失败')`));
  assert.ok(await evaluate('getSelection().toString().length === 36'));
  // Unsupported browser must show a clear message, rather than inventing IDs.
  await evaluate(`Object.defineProperty(crypto,'randomUUID',{configurable:true,value:undefined});document.querySelector('#generator').requestSubmit()`);
  assert.ok(await evaluate(`document.querySelector('#error').textContent.includes('无法安全生成')`));
  assert.equal(await evaluate(`document.querySelector('#copy-all').disabled`), true);
  console.log('Browser QA passed: English/Chinese, 100 UUIDs, invalid inputs, actual clipboard, denied clipboard, unsupported crypto, mobile overflow. Screenshots: artifacts/desktop.png and artifacts/mobile.png');
  await call('Browser.close');
} finally {
  socket?.close();
  child.kill();
}

import { generateUUIDs } from './uuid.mjs';

const zh = document.documentElement.lang === 'zh-CN';
const words = zh ? {
  copy: '复制', copied: '已复制', invalid: '请输入 1 到 100 之间的整数。',
  generated: n => `已生成 ${n} 个 UUID。`, result: n => `${n} 个 UUID`,
  copiedAll: '已复制全部 UUID，每行一个。', copiedOne: '已复制 UUID。',
  failed: '复制失败。请选中 UUID，然后按 Ctrl+C（Mac 使用 Command+C）。',
  unsupported: '此浏览器无法安全生成 UUID。请使用最新版浏览器，并通过 HTTPS 或 localhost 打开网站。'
} : {
  copy: 'Copy', copied: 'Copied', invalid: 'Enter a whole number from 1 to 100.',
  generated: n => `Generated ${n} UUID${n === 1 ? '' : 's'}.`, result: n => `${n} UUID${n === 1 ? '' : 's'}`,
  copiedAll: 'All UUIDs copied, one per line.', copiedOne: 'UUID copied.',
  failed: 'Copy failed. Select the UUIDs and press Ctrl+C (Command+C on Mac).',
  unsupported: 'Secure UUID generation is unavailable. Use a current browser on HTTPS or localhost.'
};
const form = document.querySelector('#generator');
const input = document.querySelector('#quantity');
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const copyAll = document.querySelector('#copy-all');
const copyAllLabel = copyAll.textContent;
let values = [];

async function copy(text, button, all = false) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    status.textContent = all ? words.copiedAll : words.copiedOne;
    const original = button.textContent;
    button.textContent = words.copied;
    button.disabled = true;
    setTimeout(() => { button.textContent = original; button.disabled = false; }, 1200);
  } catch {
    status.textContent = words.failed;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(all ? results : button.previousElementSibling);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function generate() {
  error.textContent = '';
  input.removeAttribute('aria-invalid');
  try {
    const next = generateUUIDs(input.value);
    values = next;
    results.replaceChildren(...values.map((uuid, i) => {
      const row = document.createElement('li');
      const number = document.createElement('span');
      number.className = 'row-number';
      number.textContent = String(i + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const code = document.createElement('code');
      code.textContent = uuid;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.textContent = words.copy;
      button.setAttribute('aria-label', `${words.copy} UUID ${i + 1}`);
      button.addEventListener('click', () => copy(uuid, button));
      row.append(number, code, button);
      return row;
    }));
    document.querySelector('#result-count').textContent = words.result(values.length);
    status.textContent = words.generated(values.length);
    copyAll.textContent = copyAllLabel;
    copyAll.disabled = false;
  } catch (e) {
    if (e instanceof RangeError) {
      error.textContent = words.invalid;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    } else {
      error.textContent = words.unsupported;
      copyAll.disabled = true;
    }
  }
}
form.addEventListener('submit', e => { e.preventDefault(); generate(); });
copyAll.addEventListener('click', () => copy(values.join('\n'), copyAll, true));
generate();

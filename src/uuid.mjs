export function parseCount(value) {
  if (!/^\d+$/.test(String(value))) throw new RangeError('Invalid count');
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 100) throw new RangeError('Invalid count');
  return count;
}

export function generateUUIDs(value, cryptoProvider = globalThis.crypto) {
  const count = parseCount(value);
  if (typeof cryptoProvider?.randomUUID !== 'function') throw new Error('Secure UUID generation unavailable');
  return Array.from({ length: count }, () => cryptoProvider.randomUUID());
}

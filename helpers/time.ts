import crypto from 'crypto';

/** yyyyMMddHHmmss (UTC หรือ Local ตาม flag) */
export function formatTimestamp(date: Date, useLocal = false): string {
  const d = date;
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = useLocal ? d.getFullYear() : d.getUTCFullYear();
  const MM = pad((useLocal ? d.getMonth() : d.getUTCMonth()) + 1);
  const dd = pad(useLocal ? d.getDate() : d.getUTCDate());
  const HH = pad(useLocal ? d.getHours() : d.getUTCHours());
  const mm = pad(useLocal ? d.getMinutes() : d.getUTCMinutes());
  const ss = pad(useLocal ? d.getSeconds() : d.getUTCSeconds());
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/** HMAC-SHA1(message, key) → hex */
export function hmacSha1Hex(key: string, message: string): string {
  return crypto.createHmac('sha1', key).update(message, 'utf8').digest('hex');
}
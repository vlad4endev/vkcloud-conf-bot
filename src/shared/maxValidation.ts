import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

const WEB_APP_DATA_KEY = 'WebAppData';

type InitDataPair = [key: string, value: string];

function normalizeInitData(data: unknown): string | null {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (data && typeof data === 'object' && 'initData' in data) {
    const initData = (data as { initData?: unknown }).initData;
    if (typeof initData === 'string') {
      const trimmed = initData.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }

  return null;
}

function parseInitDataPairs(initData: string): InitDataPair[] | null {
  const pairs: InitDataPair[] = [];
  const seenKeys = new Set<string>();

  for (const chunk of initData.split('&')) {
    if (!chunk) {
      continue;
    }

    const separatorIndex = chunk.indexOf('=');
    if (separatorIndex <= 0) {
      return null;
    }

    const key = decodeURIComponent(chunk.slice(0, separatorIndex));
    const value = decodeURIComponent(chunk.slice(separatorIndex + 1));

    if (seenKeys.has(key)) {
      return null;
    }

    seenKeys.add(key);
    pairs.push([key, value]);
  }

  return pairs.length > 0 ? pairs : null;
}

function buildLaunchParams(pairs: InitDataPair[]): string | null {
  const hashEntries = pairs.filter(([key]) => key === 'hash');
  if (hashEntries.length !== 1) {
    return null;
  }

  const launchParams = pairs
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  return launchParams.length > 0 ? launchParams : null;
}

function createSecretKey(botToken: string): Buffer {
  return createHmac('sha256', WEB_APP_DATA_KEY).update(botToken).digest();
}

function calculateHash(secretKey: Buffer, launchParams: string): string {
  return createHmac('sha256', secretKey).update(launchParams).digest('hex');
}

function hashesMatch(expected: string, actual: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(actual, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates MAX Bridge initData (userId, hash, etc.) per
 * https://dev.max.ru/docs/webapps/validation
 */
export function validateMaxUser(data: unknown): boolean {
  const initData = normalizeInitData(data);
  if (!initData) {
    return false;
  }

  const pairs = parseInitDataPairs(initData);
  if (!pairs) {
    return false;
  }

  const originalHash = pairs.find(([key]) => key === 'hash')?.[1];
  if (!originalHash) {
    return false;
  }

  const launchParams = buildLaunchParams(pairs);
  if (!launchParams) {
    return false;
  }

  const secretKey = createSecretKey(env.BOT_TOKEN);
  const calculatedHash = calculateHash(secretKey, launchParams);

  return hashesMatch(originalHash, calculatedHash);
}

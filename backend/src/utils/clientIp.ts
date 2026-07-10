const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

export const isValidIpAddress = (value: string): boolean =>
  IPV4_REGEX.test(value) || IPV6_REGEX.test(value);

export const normalizeClientIp = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  let normalized = value.trim();

  if (normalized === '::1') {
    return '127.0.0.1';
  }

  if (normalized.startsWith('::ffff:')) {
    normalized = normalized.slice('::ffff:'.length);
  }

  return isValidIpAddress(normalized) ? normalized : undefined;
};

export type BaileysModule = typeof import('@whiskeysockets/baileys');

let cachedModule: BaileysModule | null = null;

export const loadBaileys = async (): Promise<BaileysModule> => {
  if (!cachedModule) {
    cachedModule = await import('@whiskeysockets/baileys');
  }

  return cachedModule;
};

export const isBaileysAvailable = async (): Promise<boolean> => {
  try {
    const baileys = await loadBaileys();
    return typeof baileys.default === 'function';
  } catch {
    return false;
  }
};

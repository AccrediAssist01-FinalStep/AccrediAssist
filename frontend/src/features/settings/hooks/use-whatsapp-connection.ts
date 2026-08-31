'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getWhatsAppApiErrorMessage,
  whatsappService,
  type WhatsAppStatus,
} from '@/services/whatsapp.service';
import { toQrDataUrl } from '../utils/whatsapp-qr.util';

export type WhatsAppUiState =
  | 'initializing'
  | 'connected'
  | 'connecting'
  | 'qr_required'
  | 'authenticating'
  | 'disconnected'
  | 'logged_out'
  | 'error';

const STATUS_POLL_MS = 3000;
const PAIRING_TIMEOUT_MS = 180_000;

export interface UseWhatsAppConnectionResult {
  uiState: WhatsAppUiState;
  status: WhatsAppStatus | null;
  qrImageUrl: string | null;
  errorMessage: string | null;
  isBusy: boolean;
  refresh: () => Promise<void>;
  startPairing: () => Promise<void>;
}

const resolveUiState = (
  status: WhatsAppStatus | null,
  options: {
    initializing: boolean;
    pairing: boolean;
    hasQrImage: boolean;
    errorMessage: string | null;
  },
): WhatsAppUiState => {
  if (options.initializing && !status) {
    return 'initializing';
  }

  if (!status) {
    return options.errorMessage ? 'error' : 'initializing';
  }

  if (status.isConnected) {
    return 'connected';
  }

  if (status.status === 'awaiting_qr' || (options.pairing && options.hasQrImage)) {
    return options.hasQrImage ? 'authenticating' : 'qr_required';
  }

  if (status.requiresQrAuthentication) {
    return 'logged_out';
  }

  if (status.status === 'connecting' || status.status === 'reconnecting' || options.pairing) {
    return 'connecting';
  }

  if (!status.hasStoredSession) {
    return 'qr_required';
  }

  if (options.errorMessage) {
    return 'error';
  }

  return 'disconnected';
};

export function useWhatsAppConnection(enabled: boolean): UseWhatsAppConnectionResult {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [pairing, setPairing] = useState(false);

  const pairingRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQrPayloadRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  const loadStatusRef = useRef<() => Promise<WhatsAppStatus>>(async () => {
    throw new Error('WhatsApp status loader is not ready');
  });

  enabledRef.current = enabled;

  const stopTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearQr = useCallback(() => {
    lastQrPayloadRef.current = null;
    setQrImageUrl(null);
  }, []);

  const applyConnected = useCallback(
    (next: WhatsAppStatus) => {
      const finishedPairing = pairingRef.current;
      pairingRef.current = false;
      setPairing(false);
      clearQr();
      stopTimers();
      setErrorMessage(null);
      setStatus(next);
      if (finishedPairing) {
        toast.success('WhatsApp connected');
      }
    },
    [clearQr, stopTimers],
  );

  const fetchQrIfNeeded = useCallback(async (current: WhatsAppStatus): Promise<void> => {
    const shouldFetchQr =
      !current.isConnected &&
      (pairingRef.current || current.status === 'awaiting_qr' || current.hasQrCode);

    if (!shouldFetchQr) {
      return;
    }

    const qr = await whatsappService.getQr();
    if (qr.isConnected) {
      applyConnected({
        ...current,
        isConnected: true,
        isDisconnected: false,
        status: 'connected',
        hasQrCode: false,
      });
      return;
    }

    if (!qr.qrCode || lastQrPayloadRef.current === qr.qrCode) {
      return;
    }

    lastQrPayloadRef.current = qr.qrCode;
    const dataUrl = await toQrDataUrl(qr.qrCode);
    setQrImageUrl(dataUrl);
  }, [applyConnected]);

  const loadStatus = useCallback(async (): Promise<WhatsAppStatus> => {
    const next = await whatsappService.getStatus();

    if (next.isConnected) {
      applyConnected(next);
      return next;
    }

    setStatus(next);
    await fetchQrIfNeeded(next);
    return next;
  }, [applyConnected, fetchQrIfNeeded]);

  loadStatusRef.current = loadStatus;

  const refresh = useCallback(async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);
      await loadStatus();
    } catch (error) {
      const message = getWhatsAppApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setInitializing(false);
      setIsBusy(false);
    }
  }, [loadStatus]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) {
      return;
    }

    pollTimerRef.current = setInterval(() => {
      if (!enabledRef.current) {
        return;
      }
      void loadStatusRef.current().catch((error: unknown) => {
        setErrorMessage(getWhatsAppApiErrorMessage(error));
      });
    }, STATUS_POLL_MS);
  }, []);

  const startPairing = useCallback(async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);
      pairingRef.current = true;
      setPairing(true);
      clearQr();

      const next = await whatsappService.connect();
      if (next.isConnected) {
        applyConnected(next);
        return;
      }

      setStatus(next);
      await fetchQrIfNeeded(next);
      startPolling();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!pairingRef.current) {
          return;
        }
        pairingRef.current = false;
        setPairing(false);
        stopTimers();
        setErrorMessage('WhatsApp pairing timed out. Generate a new QR code and scan it again.');
        toast.error('WhatsApp pairing timed out. Please try again.');
      }, PAIRING_TIMEOUT_MS);
    } catch (error) {
      pairingRef.current = false;
      setPairing(false);
      const message = getWhatsAppApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsBusy(false);
    }
  }, [applyConnected, clearQr, fetchQrIfNeeded, startPolling, stopTimers]);

  useEffect(() => {
    if (!enabled) {
      stopTimers();
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        await loadStatus();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getWhatsAppApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      stopTimers();
    };
    // loadStatus is invoked once on mount/enable; polling uses the latest callback via interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, stopTimers]);

  useEffect(() => {
    if (!enabled || !status || status.isConnected) {
      if (status?.isConnected) {
        stopTimers();
      }
      return;
    }

    const needsPoll =
      pairing ||
      status.status === 'connecting' ||
      status.status === 'reconnecting' ||
      status.status === 'awaiting_qr';

    if (needsPoll) {
      startPolling();
    }
  }, [enabled, pairing, startPolling, status, stopTimers]);

  const uiState = resolveUiState(status, {
    initializing,
    pairing,
    hasQrImage: Boolean(qrImageUrl),
    errorMessage,
  });

  return {
    uiState,
    status,
    qrImageUrl,
    errorMessage,
    isBusy,
    refresh,
    startPairing,
  };
}

'use client';

import { Loader2, QrCode, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useWhatsAppConnection, type WhatsAppUiState } from '../hooks/use-whatsapp-connection';

const STATE_LABEL: Record<WhatsAppUiState, string> = {
  initializing: 'Checking connection',
  connected: 'Connected',
  connecting: 'Connecting',
  qr_required: 'QR Required',
  authenticating: 'Waiting for scan',
  disconnected: 'Disconnected',
  logged_out: 'Logged Out',
  error: 'Error',
};

const STATE_BADGE: Record<WhatsAppUiState, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  initializing: 'secondary',
  connected: 'success',
  connecting: 'warning',
  qr_required: 'warning',
  authenticating: 'warning',
  disconnected: 'destructive',
  logged_out: 'destructive',
  error: 'destructive',
};

const formatTimestamp = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

interface SettingsWhatsAppProps {
  enabled: boolean;
}

export function SettingsWhatsApp({ enabled }: SettingsWhatsAppProps) {
  const { uiState, status, qrImageUrl, errorMessage, isBusy, refresh, startPairing } =
    useWhatsAppConnection(enabled);

  if (!enabled) {
    return null;
  }

  const lastConnected = formatTimestamp(status?.lastConnectedAt);
  const showQr = Boolean(qrImageUrl) && uiState !== 'connected';
  const needsConnect =
    uiState === 'qr_required' ||
    uiState === 'logged_out' ||
    uiState === 'disconnected' ||
    uiState === 'error';
  const isConnecting = uiState === 'connecting' || uiState === 'authenticating';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>WhatsApp Integration</CardTitle>
            <CardDescription>
              Monitor the WhatsApp listener and pair a device when a QR scan is required.
            </CardDescription>
          </div>
          <Badge variant={STATE_BADGE[uiState]}>{STATE_LABEL[uiState]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {uiState === 'initializing' ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'rounded-lg p-2',
                  uiState === 'connected'
                    ? 'bg-success/10 text-success'
                    : 'bg-primary/10 text-primary',
                )}
              >
                {uiState === 'connected' ? (
                  <Wifi className="size-4" aria-hidden="true" />
                ) : (
                  <WifiOff className="size-4" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {uiState === 'connected'
                    ? 'WhatsApp Connected'
                    : uiState === 'connecting' || uiState === 'authenticating'
                      ? 'Connecting WhatsApp'
                      : 'WhatsApp Disconnected'}
                </p>
                <p className="text-sm text-muted">
                  {uiState === 'connected'
                    ? status?.isMessageListenerActive
                      ? 'The message listener is active and monitoring allowed groups.'
                      : 'Connected. The message listener is starting.'
                    : uiState === 'logged_out'
                      ? 'The saved WhatsApp session is no longer valid. Scan a new QR code to reconnect.'
                      : uiState === 'qr_required'
                        ? 'No valid WhatsApp session is available. Scan a QR code to connect.'
                        : uiState === 'connecting' || uiState === 'authenticating'
                          ? 'Waiting for WhatsApp to finish connecting.'
                          : 'WhatsApp is not connected. Use Connect WhatsApp if a QR scan is required.'}
                </p>
                {lastConnected ? (
                  <p className="mt-1 text-sm text-muted">Last connected: {lastConnected}</p>
                ) : null}
                {status?.allowedGroups.length ? (
                  <p className="mt-1 text-sm text-muted">
                    Allowed groups: {status.allowedGroups.join(', ')}
                  </p>
                ) : null}
              </div>
            </div>

            {errorMessage ? (
              <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {errorMessage}
              </p>
            ) : null}

            {isConnecting && !showQr ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Connecting to WhatsApp…
              </div>
            ) : null}

            {showQr ? (
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <QrCode className="size-4 text-primary" aria-hidden="true" />
                  Scan this QR code
                </div>
                <p className="mt-1 text-sm text-muted">
                  Open WhatsApp → Linked Devices → Link a Device → Scan this QR code.
                </p>
                <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrImageUrl ?? ''}
                    alt="WhatsApp pairing QR code"
                    width={280}
                    height={280}
                    className="size-[220px] sm:size-[280px]"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Smartphone className="size-4" aria-hidden="true" />
                  Waiting for WhatsApp to confirm the scan…
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refresh()}
                disabled={isBusy}
                className="gap-2"
              >
                {isBusy && uiState === 'connected' ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                Refresh Status
              </Button>

              {needsConnect ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void startPairing()}
                  disabled={isBusy}
                  className="gap-2"
                >
                  {isBusy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <QrCode className="size-4" aria-hidden="true" />
                  )}
                  Connect WhatsApp / Scan QR
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

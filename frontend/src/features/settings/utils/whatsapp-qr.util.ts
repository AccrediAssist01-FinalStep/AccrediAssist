import QRCode from 'qrcode';

export const toQrDataUrl = async (qrPayload: string): Promise<string> => {
  return QRCode.toDataURL(qrPayload, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
};

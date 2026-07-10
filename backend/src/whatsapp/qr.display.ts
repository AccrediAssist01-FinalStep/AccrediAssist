import qrcode from 'qrcode-terminal';

export const displayQrInTerminal = (qr: string): void => {
  console.log('\nScan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\nOpen WhatsApp > Linked Devices > Link a Device\n');
};

export interface SignatureSigner {
  userId: string;
  displayName: string;
}

export interface DigitalSignatureResult {
  dataUrl: string;
  blob: Blob;
  mimeType: 'image/png';
  signedBy: Readonly<SignatureSigner>;
  /** ISO-8601 local time including the computer's UTC offset. */
  signedAt: string;
  /** IANA time zone reported by the browser, for example Africa/Johannesburg. */
  timeZone: string;
}

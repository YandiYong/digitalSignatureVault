# @yandiswanpm/digital-signature

Reusable Angular components for capturing a handwritten signature. The library captures and emits signature data; the host application owns authentication, document context, validation, and persistence.

## Requirements

- Angular 20
- Angular Material 20
- Angular CDK 20
- An Angular Material theme in the host application

## Install

```bash
npm install @yandiswanpm/digital-signature
```

## Use the signature form

```ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  DigitalSignatureResult,
  DsvSignatureFormComponent,
  SignatureSigner,
} from '@yandiswanpm/digital-signature';

@Component({
  selector: 'app-document-signature',
  standalone: true,
  imports: [DsvSignatureFormComponent],
  template: `
    <dsv-signature-form
      [signer]="signedInUser"
      heading="Sign this document"
      confirmButtonText="Acknowledge and Sign"
      [disabled]="isSaving"
      (signatureConfirmed)="saveSignature($event)"
    />
  `,
})
export class DocumentSignatureComponent {
  private readonly http = inject(HttpClient);

  // Supply this value from the host application's authentication/session service.
  readonly signedInUser: SignatureSigner = {
    userId: 'authenticated-user-id',
    displayName: 'Authenticated User',
  };

  isSaving = false;

  saveSignature(signature: DigitalSignatureResult): void {
    this.isSaving = true;
    const request = {
      image: signature.dataUrl,
      mimeType: signature.mimeType,
      signedByUserId: signature.signedBy.userId,
      signedByName: signature.signedBy.displayName,
      signedAt: signature.signedAt,
      timeZone: signature.timeZone,
    };

    this.http.post('/your-api/signatures', request).subscribe({
      next: () => {
        this.isSaving = false;
        // Clear through a ViewChild only after the API confirms persistence.
      },
      error: () => {
        this.isSaving = false;
        // The library keeps the signature visible so the user can retry.
      },
    });
  }
}
```

For JSON APIs, send `dataUrl`. For multipart uploads, send `blob` in `FormData`.

## Emitted result

```ts
interface DigitalSignatureResult {
  dataUrl: string;
  blob: Blob;
  mimeType: 'image/png';
  signedBy: {
    userId: string;
    displayName: string;
  };
  signedAt: string;
  timeZone: string;
}
```

`signedAt` is ISO-8601 local time with the browser computer's UTC offset, for example `2026-08-24T15:30:00.000+02:00`. `timeZone` contains the browser's IANA zone when available, for example `Africa/Johannesburg`.

The host API should still use its authenticated identity and server timestamp as the authoritative audit values.

## Build

```bash
ng build digital-signature
```

## Test

```bash
ng test digital-signature --watch=false
```

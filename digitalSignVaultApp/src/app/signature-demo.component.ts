import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  DigitalSignatureResult,
  DsvPageComponent,
  SignatureSigner,
} from '@yandiswanpm/digital-signature';

@Component({
  selector: 'app-signature-demo',
  standalone: true,
  imports: [DsvPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dsv-page
      [signer]="signedInUser"
      confirmButtonText="Use Signature"
      (signatureConfirmed)="handleSignature($event)"
    />

    @if (lastSignature(); as signature) {
      <section class="result" aria-live="polite">
        <h2>Signature received by the host application</h2>
        <p><strong>Signed by:</strong> {{ signature.signedBy.displayName }}</p>
        <p><strong>Local signing time:</strong> {{ signature.signedAt }}</p>
        <p><strong>Time zone:</strong> {{ signature.timeZone }}</p>
        <p>The host application can now send this result to its own API.</p>
      </section>
    }
  `,
  styles: `
    .result {
      max-width: 640px;
      margin: 0 auto 24px;
      padding: 16px;
      border: 1px solid #d7e3f4;
      border-radius: 8px;
      background: #f6f9fe;
    }
    .result h2 { margin-top: 0; font-size: 18px; }
    .result p { margin: 4px 0; }
  `,
})
export class SignatureDemoComponent {
  readonly signedInUser: SignatureSigner = {
    userId: 'demo-user-001',
    displayName: 'Demo User',
  };

  readonly lastSignature = signal<DigitalSignatureResult | null>(null);

  handleSignature(signature: DigitalSignatureResult): void {
    this.lastSignature.set(signature);
  }
}

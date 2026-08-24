import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  DigitalSignatureResult,
  SignatureSigner,
} from '../models/digital-signature-result';
import { DsvHeaderComponent } from './dsv-header.component';
import { DsvSignatureFormComponent } from './dsv-signature-form.component';

@Component({
  selector: 'dsv-page',
  standalone: true,
  imports: [DsvHeaderComponent, DsvSignatureFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dsv-header />

    <main class="container">
      <dsv-signature-form
        [signer]="signer()"
        [heading]="heading()"
        [confirmButtonText]="confirmButtonText()"
        [disabled]="disabled()"
        (signatureConfirmed)="signatureConfirmed.emit($event)"
      />
    </main>
  `,
  styles: [
    `
      .container { max-width: 720px; margin: 0 auto; padding: 24px; }
    `,
  ],
})
export class DsvPageComponent {
  readonly signer = input.required<SignatureSigner>();
  readonly heading = input('Create Digital Signature');
  readonly confirmButtonText = input('Confirm Signature');
  readonly disabled = input(false);
  readonly signatureConfirmed = output<DigitalSignatureResult>();
}

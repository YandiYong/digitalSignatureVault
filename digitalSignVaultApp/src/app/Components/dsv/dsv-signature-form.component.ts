import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  signal,
  effect,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { DsvStore } from './dsv.store';
import { SignatureApiService } from './signature-api.service';

@Component({
  selector: 'dsv-signature-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule,
  ],
  template: `
    <mat-card class="panel">
      <h2 class="panel-title">Create Digital Signature</h2>

      <div class="canvas-block">
        <label>Sign Here</label>
        <div class="controls">
          <input type="color" [value]="store.penColor()" (input)="onColor($event)" aria-label="Pen color" />
          <mat-slider>
            <input matSliderThumb [value]="store.lineWidth()" (input)="onWidth($event)" min="1" max="12" step="1" />
          </mat-slider>
        </div>
        <canvas
          #canvas
          class="canvas"
          width="400"
          height="150"
          (pointerdown)="start($event)"
          (pointermove)="move($event)"
          (pointerup)="stop()"
          (pointerleave)="stop()"
        ></canvas>
      </div>

      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Signature For</mat-label>
          <mat-select [value]="store.signatureFor()" (selectionChange)="store.setSignatureFor($event.value)">
            <mat-option value="">Select who signs</mat-option>
            <mat-option value="Patient">Patient</mat-option>
            <mat-option value="Guardian">Guardian</mat-option>
            <mat-option value="Healthcare Provider">Healthcare Provider</mat-option>
            <mat-option value="Witness">Witness</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Select Purpose</mat-label>
          <mat-select [value]="store.purpose()" (selectionChange)="store.setPurpose($event.value)">
            <mat-option value="">Choose document type</mat-option>
            <mat-option value="Consent Form">Consent Form</mat-option>
            <mat-option value="Intervention Session">Intervention Session</mat-option>
            <mat-option value="Treatment Plan">Treatment Plan</mat-option>
            <mat-option value="Discharge Form">Discharge Form</mat-option>
            <mat-option value="Financial Agreement">Financial Agreement</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="actions">
        <button mat-stroked-button color="primary" (click)="clear()">Clear</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="!canSave()">Save Signature</button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .panel { padding: 16px; }
      .panel-title { font-weight: 700; margin-bottom: 12px; }
      .canvas-block label { display: block; margin-bottom: 8px; color: #555; }
      .controls { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .canvas { width: 100%; border: 2px solid #e0e0e0; border-radius: 8px; background: #fff; touch-action: none; cursor: crosshair; }
      .form-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 16px 0; }
      @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
      .actions { display: flex; gap: 12px; }
    `,
  ],
})
export class DsvSignatureFormComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly isDrawing = signal(false);
  readonly hasSignature = signal(false);
  readonly canSave = computed(() =>
    this.hasSignature() && !!this.store.signatureFor() && !!this.store.purpose()
  );
  private ctx!: CanvasRenderingContext2D;
  private resizeObserver?: ResizeObserver;

  constructor(public store: DsvStore, private api: SignatureApiService) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.resizeToDisplaySize();
    this.resizeObserver = new ResizeObserver(() => this.resizeToDisplaySize());
    this.resizeObserver.observe(canvas);

    effect(() => {
      this.ctx.strokeStyle = this.store.penColor();
      this.ctx.lineWidth = this.store.lineWidth();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private resizeToDisplaySize() {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      // Re-apply pen settings after scaling
      this.ctx.strokeStyle = this.store.penColor();
      this.ctx.lineWidth = this.store.lineWidth();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  start(ev: PointerEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.isDrawing.set(true);
    this.ctx.beginPath();
    this.ctx.moveTo(ev.clientX - rect.left, ev.clientY - rect.top);
    canvas.setPointerCapture(ev.pointerId);
    // Mark that the canvas has content once drawing starts
    this.hasSignature.set(true);
  }

  move(ev: PointerEvent) {
    if (!this.isDrawing()) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
    this.ctx.stroke();
  }

  stop() {
    this.isDrawing.set(false);
  }

  clear() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature.set(false);
  }

  save() {
    if (!this.canSave()) {
      alert('Please fill in all fields');
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    // Add locally and auto-save to backend
    this.store.addSignature(dataUrl);
    const payload = {
      image: dataUrl,
      user: this.store.currentUser(),
      purpose: this.store.purpose(),
      signedFor: this.store.signatureFor(),
      date: new Date().toISOString(),
    };
    this.api.save(payload).subscribe({
      next: () => {},
      error: (e) => console.error('API save failed', e),
    });
    this.clear();
    this.store.setSignatureFor('');
    this.store.setPurpose('');
  }

  onColor(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    this.store.setPenColor(value);
    // Apply immediately to current drawing context
    this.ctx.strokeStyle = value;
  }

  onWidth(ev: Event) {
    const value = Number((ev.target as HTMLInputElement).value);
    if (!Number.isNaN(value)) this.store.setLineWidth(value);
  }
}

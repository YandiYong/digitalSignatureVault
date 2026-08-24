import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import {
  DigitalSignatureResult,
  SignatureSigner,
} from '../models/digital-signature-result';
import { getLocalTimeZone, toLocalIsoString } from '../utils/local-date-time';

interface SignaturePoint {
  x: number;
  y: number;
}

interface SignatureStroke {
  color: string;
  width: number;
  points: SignaturePoint[];
}

@Component({
  selector: 'dsv-signature-form',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatSliderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="panel">
      <h2 class="panel-title">{{ heading() }}</h2>

      <div class="signer" aria-label="Signature details">
        <span>Signed by</span>
        <strong>{{ signer().displayName }}</strong>
      </div>

      <div class="canvas-block">
        <label for="dsv-signature-canvas">Sign here</label>
        <div class="controls">
          <input
            type="color"
            [value]="penColor()"
            (input)="onColor($event)"
            [disabled]="disabled()"
            aria-label="Pen color"
          />
          <mat-slider>
            <input
              matSliderThumb
              [value]="lineWidth()"
              (input)="onWidth($event)"
              [disabled]="disabled()"
              min="1"
              max="12"
              step="1"
            />
          </mat-slider>
        </div>
        <canvas
          #canvas
          id="dsv-signature-canvas"
          class="canvas"
          [class.canvas-disabled]="disabled()"
          width="400"
          height="200"
          (pointerdown)="start($event)"
          (pointermove)="move($event)"
          (pointerup)="stop()"
          (pointerleave)="stop()"
        ></canvas>
      </div>

      <div class="actions">
        <button mat-stroked-button type="button" (click)="undo()" [disabled]="disabled() || !hasSignature()">
          Undo
        </button>
        <button mat-stroked-button type="button" (click)="clear()" [disabled]="disabled() || !hasSignature()">
          Clear
        </button>
        <button mat-flat-button type="button" (click)="confirmSignature()" [disabled]="!canConfirm()">
          {{ confirmButtonText() }}
        </button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .panel { padding: 16px; }
      .panel-title { font-weight: 700; margin: 0 0 12px; }
      .signer { display: grid; gap: 2px; margin-bottom: 16px; }
      .signer span { color: #666; font-size: 12px; }
      .canvas-block label { display: block; margin-bottom: 8px; color: #555; }
      .controls { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .canvas { width: 100%; border: 2px solid #e0e0e0; border-radius: 8px; background: #fff; touch-action: none; cursor: crosshair; }
      .canvas-disabled { cursor: not-allowed; opacity: 0.65; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    `,
  ],
})
export class DsvSignatureFormComponent implements AfterViewInit, OnDestroy {
  readonly signer = input.required<SignatureSigner>();
  readonly heading = input('Create Digital Signature');
  readonly confirmButtonText = input('Confirm Signature');
  readonly disabled = input(false);
  readonly signatureConfirmed = output<DigitalSignatureResult>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly isDrawing = signal(false);
  readonly hasSignature = signal(false);
  readonly penColor = signal('#000000');
  readonly lineWidth = signal(2);
  readonly canConfirm = computed(() => {
    const signer = this.signer();
    return (
      this.hasSignature() &&
      !this.disabled() &&
      signer.userId.trim().length > 0 &&
      signer.displayName.trim().length > 0
    );
  });

  private ctx!: CanvasRenderingContext2D;
  private resizeObserver?: ResizeObserver;
  private strokes: SignatureStroke[] = [];
  private currentStroke?: SignatureStroke;

  private readonly penSettingsEffect = effect(() => {
    if (!this.ctx) {
      return;
    }
    this.applyPenSettings();
  });

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    this.ctx = ctx;
    this.resizeToDisplaySize();
    this.resizeObserver = new ResizeObserver(() => this.resizeToDisplaySize());
    this.resizeObserver.observe(canvas);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  start(event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const point = this.getPoint(event);
    this.isDrawing.set(true);
    this.ctx.beginPath();
    this.ctx.moveTo(point.x, point.y);
    canvas.setPointerCapture(event.pointerId);
    this.hasSignature.set(true);
    this.currentStroke = {
      color: this.penColor(),
      width: this.lineWidth(),
      points: [point],
    };
  }

  move(event: PointerEvent): void {
    if (!this.isDrawing() || this.disabled()) {
      return;
    }

    const point = this.getPoint(event);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();
    this.currentStroke?.points.push(point);
  }

  stop(): void {
    this.isDrawing.set(false);
    if (this.currentStroke) {
      this.strokes.push(this.currentStroke);
      this.currentStroke = undefined;
    }
  }

  clear(): void {
    if (!this.ctx) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature.set(false);
    this.strokes = [];
  }

  undo(): void {
    if (this.isDrawing() || this.disabled() || this.strokes.length === 0) {
      return;
    }

    this.strokes.pop();
    this.redrawAll();
    this.hasSignature.set(this.strokes.length > 0);
  }

  confirmSignature(): void {
    if (!this.canConfirm()) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const dataUrl = canvas.toDataURL('image/png');
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const signedAt = new Date();
      this.signatureConfirmed.emit({
        dataUrl,
        blob,
        mimeType: 'image/png',
        signedBy: { ...this.signer() },
        signedAt: toLocalIsoString(signedAt),
        timeZone: getLocalTimeZone(),
      });
    }, 'image/png');
  }

  onColor(event: Event): void {
    this.penColor.set((event.target as HTMLInputElement).value);
  }

  onWidth(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(value)) {
      this.lineWidth.set(value);
    }
  }

  private getPoint(event: PointerEvent): SignaturePoint {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private resizeToDisplaySize(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
    }

    this.redrawAll();
  }

  private redrawAll(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of this.strokes) {
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (stroke.points.length === 0) {
        continue;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let index = 1; index < stroke.points.length; index += 1) {
        this.ctx.lineTo(stroke.points[index].x, stroke.points[index].y);
      }
      this.ctx.stroke();
    }

    this.applyPenSettings();
  }

  private applyPenSettings(): void {
    this.ctx.strokeStyle = this.penColor();
    this.ctx.lineWidth = this.lineWidth();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
}

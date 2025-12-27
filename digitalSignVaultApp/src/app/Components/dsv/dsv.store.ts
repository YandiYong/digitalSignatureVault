import { Injectable, effect, signal } from '@angular/core';

export interface StoredSignature {
  id: number;
  image: string; // data URL
  user: string;
  purpose: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class DsvStore {
  readonly currentUser = signal<string>('User');
  readonly activeNav = signal<'dashboard' | 'documents' | 'verification'>('dashboard');
  readonly signatureFor = signal<string>('');
  readonly purpose = signal<string>('');
  readonly penColor = signal<string>('#000000');
  readonly lineWidth = signal<number>(2);
  readonly signatures = signal<StoredSignature[]>([]);

  constructor() {
    // Load from localStorage
    const raw = localStorage.getItem('dsv.signatures');
    if (raw) {
      try {
        this.signatures.set(JSON.parse(raw));
      } catch {}
    }
    // Persist to localStorage
    effect(() => {
      try {
        localStorage.setItem('dsv.signatures', JSON.stringify(this.signatures()));
      } catch {}
    });
  }

  setActiveNav(tab: 'dashboard' | 'documents' | 'verification') {
    this.activeNav.set(tab);
  }
  setSignatureFor(value: string) {
    this.signatureFor.set(value);
  }
  setPurpose(value: string) {
    this.purpose.set(value);
  }
  setPenColor(hex: string) {
    this.penColor.set(hex);
  }
  setLineWidth(w: number) {
    this.lineWidth.set(w);
  }

  addSignature(imageDataUrl: string) {
    const id = this.signatures().length + 1;
    const date = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
    const entry: StoredSignature = {
      id,
      image: imageDataUrl,
      user: this.currentUser(),
      purpose: this.purpose(),
      date,
    };
    this.signatures.update((arr) => [entry, ...arr]);
  }

  exportAsJson(): Blob {
    const json = JSON.stringify(this.signatures(), null, 2);
    return new Blob([json], { type: 'application/json' });
  }
}

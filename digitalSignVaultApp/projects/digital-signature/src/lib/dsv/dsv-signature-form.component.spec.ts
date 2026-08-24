import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DsvSignatureFormComponent } from './dsv-signature-form.component';

describe('DsvSignatureFormComponent', () => {
  let component: DsvSignatureFormComponent;
  let fixture: ComponentFixture<DsvSignatureFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsvSignatureFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DsvSignatureFormComponent);
    fixture.componentRef.setInput('signer', {
      userId: 'user-123',
      displayName: 'Test User',
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the supplied signer without select fields', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Test User');
    expect(element.querySelector('mat-select')).toBeNull();
    expect(element.querySelector('select')).toBeNull();
  });

  it('emits the image, signer, and local timestamp without clearing the canvas', (done) => {
    component.hasSignature.set(true);
    component.signatureConfirmed.subscribe((result) => {
      expect(result.mimeType).toBe('image/png');
      expect(result.dataUrl.startsWith('data:image/png;base64,')).toBeTrue();
      expect(result.blob.type).toBe('image/png');
      expect(result.signedBy).toEqual({ userId: 'user-123', displayName: 'Test User' });
      expect(result.signedAt).toMatch(/[+-]\d{2}:\d{2}$/);
      expect(result.timeZone.length).toBeGreaterThan(0);
      expect(component.hasSignature()).toBeTrue();
      done();
    });

    component.confirmSignature();
  });
});

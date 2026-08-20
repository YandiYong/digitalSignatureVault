import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalSignature } from './digital-signature';

describe('DigitalSignature', () => {
  let component: DigitalSignature;
  let fixture: ComponentFixture<DigitalSignature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalSignature]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalSignature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

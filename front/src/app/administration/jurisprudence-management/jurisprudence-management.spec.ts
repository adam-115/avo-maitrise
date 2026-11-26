import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JurisprudenceManagement } from './jurisprudence-management';

describe('JurisprudenceManagement', () => {
  let component: JurisprudenceManagement;
  let fixture: ComponentFixture<JurisprudenceManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JurisprudenceManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JurisprudenceManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

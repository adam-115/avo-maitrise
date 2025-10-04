import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DossierFacture } from './dossier-facture';

describe('DossierFacture', () => {
  let component: DossierFacture;
  let fixture: ComponentFixture<DossierFacture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierFacture]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossierFacture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

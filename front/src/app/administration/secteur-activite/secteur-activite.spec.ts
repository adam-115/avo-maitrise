import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecteurActivite } from './secteur-activite';

describe('SecteurActivite', () => {
  let component: SecteurActivite;
  let fixture: ComponentFixture<SecteurActivite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecteurActivite]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecteurActivite);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

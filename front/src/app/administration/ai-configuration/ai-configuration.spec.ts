import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiConfiguration } from './ai-configuration';

describe('AiConfiguration', () => {
  let component: AiConfiguration;
  let fixture: ComponentFixture<AiConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiConfiguration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiConfiguration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

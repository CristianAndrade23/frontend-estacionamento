import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursosHumanosRelatoriosComponent } from './recursos-humanos-relatorios.component';

describe('RecursosHumanosRelatoriosComponent', () => {
  let component: RecursosHumanosRelatoriosComponent;
  let fixture: ComponentFixture<RecursosHumanosRelatoriosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecursosHumanosRelatoriosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecursosHumanosRelatoriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

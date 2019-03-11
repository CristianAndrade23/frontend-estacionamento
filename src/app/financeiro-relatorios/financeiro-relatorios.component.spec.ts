import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceiroRelatoriosComponent } from './financeiro-relatorios.component';

describe('FinanceiroRelatoriosComponent', () => {
  let component: FinanceiroRelatoriosComponent;
  let fixture: ComponentFixture<FinanceiroRelatoriosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinanceiroRelatoriosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceiroRelatoriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

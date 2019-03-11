import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceiroCaixaComponent } from './financeiro-caixa.component';

describe('FinanceiroCaixaComponent', () => {
  let component: FinanceiroCaixaComponent;
  let fixture: ComponentFixture<FinanceiroCaixaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinanceiroCaixaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceiroCaixaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

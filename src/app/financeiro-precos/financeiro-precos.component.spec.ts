import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceiroPrecosComponent } from './financeiro-precos.component';

describe('FinanceiroPrecosComponent', () => {
  let component: FinanceiroPrecosComponent;
  let fixture: ComponentFixture<FinanceiroPrecosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FinanceiroPrecosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceiroPrecosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

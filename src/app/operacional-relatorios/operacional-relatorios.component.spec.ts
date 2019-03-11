import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionalRelatoriosComponent } from './operacional-relatorios.component';

describe('OperacionalRelatoriosComponent', () => {
  let component: OperacionalRelatoriosComponent;
  let fixture: ComponentFixture<OperacionalRelatoriosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OperacionalRelatoriosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OperacionalRelatoriosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

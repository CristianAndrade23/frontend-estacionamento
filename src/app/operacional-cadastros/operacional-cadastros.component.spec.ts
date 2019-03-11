import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionalCadastrosComponent } from './operacional-cadastros.component';

describe('OperacionalCadastrosComponent', () => {
  let component: OperacionalCadastrosComponent;
  let fixture: ComponentFixture<OperacionalCadastrosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OperacionalCadastrosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OperacionalCadastrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

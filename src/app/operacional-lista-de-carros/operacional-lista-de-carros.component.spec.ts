import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionalListaDeCarrosComponent } from './operacional-lista-de-carros.component';

describe('OperacionalListaDeCarrosComponent', () => {
  let component: OperacionalListaDeCarrosComponent;
  let fixture: ComponentFixture<OperacionalListaDeCarrosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OperacionalListaDeCarrosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OperacionalListaDeCarrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

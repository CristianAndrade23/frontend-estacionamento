import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursosHumanosCadastrosComponent } from './recursos-humanos-cadastros.component';

describe('RecursosHumanosCadastrosComponent', () => {
  let component: RecursosHumanosCadastrosComponent;
  let fixture: ComponentFixture<RecursosHumanosCadastrosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecursosHumanosCadastrosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecursosHumanosCadastrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

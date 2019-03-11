import {Component, DoCheck, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, DoCheck {

  @Input() abaPainel: number;
  @Output() mudarAbaEvent = new EventEmitter<number>();
  @Output() fazerLogoffEvent = new EventEmitter();

  aba = 0;

  mostrarOpcoesOperacional = false;
  mostrarOpcoesFinanceiro = false;
  mostrarOpcoesRH = false;

  constructor() { }

  ngOnInit() {
  }

  ngDoCheck(): void {
    if(this.abaPainel === 1 || this.abaPainel === 2 || this.abaPainel === 3){
      this.mostrarOpcoesOperacional = true;
    }
  }

  abrirOpcoesOperacional(){
    this.mostrarOpcoesOperacional = !this.mostrarOpcoesOperacional;

    if (this.mostrarOpcoesFinanceiro || this.mostrarOpcoesRH){
      this.mostrarOpcoesFinanceiro = false;
      this.mostrarOpcoesRH = false;
    }
  }

  abrirOpcoesFinanceiro(){
    this.mostrarOpcoesFinanceiro = !this.mostrarOpcoesFinanceiro;

    if (this.mostrarOpcoesOperacional || this.mostrarOpcoesRH){
      this.mostrarOpcoesOperacional = false;
      this.mostrarOpcoesRH = false;
    }
  }

  abrirOpcoesRH(){
    this.mostrarOpcoesRH = !this.mostrarOpcoesRH;

    if (this.mostrarOpcoesOperacional || this.mostrarOpcoesFinanceiro){
      this.mostrarOpcoesOperacional = false;
      this.mostrarOpcoesFinanceiro = false;
    }
  }

  mudarAba(aba: number) {
    this.mudarAbaEvent.emit(aba);
    if (aba !== 1 && aba !== 2 && aba !== 3){
      this.mostrarOpcoesOperacional = false;
    }
    if (aba !== 4 && aba !== 5 && aba !== 6){
      this.mostrarOpcoesFinanceiro = false;
    }
    if (aba !== 7 && aba !== 8 && aba !== 9){
      this.mostrarOpcoesRH = false;
    }
    if (this.mostrarOpcoesOperacional === true){
      this.mostrarOpcoesFinanceiro = false;
      this.mostrarOpcoesRH = false;
    }
    if (this.mostrarOpcoesFinanceiro === true){
      this.mostrarOpcoesOperacional = false;
      this.mostrarOpcoesRH = false;
    }
    if (this.mostrarOpcoesRH === true){
      this.mostrarOpcoesFinanceiro = false;
      this.mostrarOpcoesOperacional = false;
    }
  }

  fazerLogOff(){
    this.fazerLogoffEvent.emit(false)
  }

}

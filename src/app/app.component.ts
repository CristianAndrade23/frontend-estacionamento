import {Component, Input, Output} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    
  abaPainel = 0;
  loginFeito = false;

  constructor() {
  }

  enviaNumero(evento) {
    this.abaPainel = evento;
  }

  recebeLoginFeito(evento){
    this.loginFeito = evento;
  }

  recebeLogoffEvent(evento){
    this.loginFeito = evento;
  }


}

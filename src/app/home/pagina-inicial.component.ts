import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-pagina-inicial',
  templateUrl: './pagina-inicial.component.html',
  styleUrls: ['./pagina-inicial.component.css']
})
export class PaginaInicialComponent implements OnInit {

  @Output() enviaEventoIrHome = new EventEmitter<number>();
  irHome: number;
  constructor() { }

  ngOnInit() {
  }

  irParaOperacional(numeroAbaHome){
    this.irHome = numeroAbaHome;
    this.enviaEventoIrHome.emit(this.irHome);
  }

}

import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  selector: 'app-operacional-lista-de-carros',
  templateUrl: './operacional-lista-de-carros.component.html',
  styleUrls: ['./operacional-lista-de-carros.component.css']
})
export class OperacionalListaDeCarrosComponent implements OnInit {

  @ViewChild('templateModalNovaEntrada') templateModalNovaEntrada: TemplateRef<any>;

  novaMarcaRef: BsModalRef;

  noPatioSelecionado = true;
  todosSelecionado = false;

  constructor(private modalService: BsModalService) { }

  ngOnInit() {
  }

  mudarParaNoPatio(){
    if (this.noPatioSelecionado){
     return null;
    } else {
       this.noPatioSelecionado = true;
       this.todosSelecionado = false;
    }
  }

  mudarParaTodos(){
    if (this.todosSelecionado){
      return null;
    } else {
      this.todosSelecionado = true;
      this.noPatioSelecionado = false;
    }
  }

  abrirModalNovaEntrada(templateModalNovaEntrada: TemplateRef<any>){
    this.novaMarcaRef = this.modalService.show(templateModalNovaEntrada);
  }

}

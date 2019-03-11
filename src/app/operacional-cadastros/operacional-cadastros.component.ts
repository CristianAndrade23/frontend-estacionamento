import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  selector: 'app-operacional-cadastros',
  templateUrl: './operacional-cadastros.component.html',
  styleUrls: ['./operacional-cadastros.component.css']
})
export class OperacionalCadastrosComponent implements OnInit {

  @ViewChild('templateNovaMarca') templateNovaMarca: TemplateRef<any>;
  @ViewChild('templateModalNovoModelo') templateModalNovoModelo: TemplateRef<any>;

  novaMarcaRef: BsModalRef;
  novoModeloRef: BsModalRef;

  constructor(private modalService: BsModalService) { }

  ngOnInit() {
  }

  abrirModalNovaMarca(templateNovaMarca: TemplateRef<any>) {
    this.novaMarcaRef = this.modalService.show(templateNovaMarca);
  }

  abrirModalNovoModelo(templateModalNovoModelo: TemplateRef<any>){
    this.novoModeloRef = this.modalService.show(templateModalNovoModelo);
  }


}

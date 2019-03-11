import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  selector: 'app-recursos-humanos-cadastros',
  templateUrl: './recursos-humanos-cadastros.component.html',
  styleUrls: ['./recursos-humanos-cadastros.component.css']
})
export class RecursosHumanosCadastrosComponent implements OnInit {

  @ViewChild('templateNovaFuncao') templateNovaFuncao: TemplateRef<any>;
  @ViewChild('templateModalNovoFuncionario') templateModalNovoFuncionario: TemplateRef<any>;


  novaFuncaoRef: BsModalRef;
  novoFuncionarioRef: BsModalRef;

  constructor(private modalService: BsModalService) { }

  ngOnInit() {
  }


  abrirModalNovaFuncao(templateNovaFuncao: TemplateRef<any>) {
    this.novaFuncaoRef = this.modalService.show(templateNovaFuncao);
  }

  abrirModalNovoFuncionario(templateModalNovoFuncionario: TemplateRef<any>){
    this.novoFuncionarioRef = this.modalService.show(templateModalNovoFuncionario);

  }

}

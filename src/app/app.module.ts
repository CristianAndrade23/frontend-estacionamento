import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { PaginaInicialComponent } from './home/pagina-inicial.component';
import { ConfiguracoesComponent } from './configuracoes/configuracoes.component';
import { OperacionalCadastrosComponent } from './operacional-cadastros/operacional-cadastros.component';
import { OperacionalListaDeCarrosComponent } from './operacional-lista-de-carros/operacional-lista-de-carros.component';
import { OperacionalRelatoriosComponent } from './operacional-relatorios/operacional-relatorios.component';
import { FinanceiroCaixaComponent } from './financeiro-caixa/financeiro-caixa.component';
import { FinanceiroPrecosComponent } from './financeiro-precos/financeiro-precos.component';
import { FinanceiroRelatoriosComponent } from './financeiro-relatorios/financeiro-relatorios.component';
import { RecursosHumanosCadastrosComponent } from './recursos-humanos-cadastros/recursos-humanos-cadastros.component';
import { RecursosHumanosRelatoriosComponent } from './recursos-humanos-relatorios/recursos-humanos-relatorios.component';
import {ModalModule} from 'ngx-bootstrap';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    PaginaInicialComponent,
    ConfiguracoesComponent,
    OperacionalCadastrosComponent,
    OperacionalListaDeCarrosComponent,
    OperacionalRelatoriosComponent,
    FinanceiroCaixaComponent,
    FinanceiroPrecosComponent,
    FinanceiroRelatoriosComponent,
    RecursosHumanosCadastrosComponent,
    RecursosHumanosRelatoriosComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ModalModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

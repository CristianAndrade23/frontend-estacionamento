import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { appSettings } from '../config';
import {
  Caixa,
  Empresa,
  FormaPagamento,
  Funcao,
  Funcionario,
  FuncionarioRequest,
  Marca,
  Modelo,
  ModeloRequest,
  Movimentacao,
  Preco,
  TipoVeiculo,
} from '../models';

export const API = appSettings.apiUrl;

/** Monta `?de=…&ate=…` e similares, ignorando valores vazios. */
export function comParams(url: string, params: object): string {
  let query = new HttpParams();
  for (const [chave, valor] of Object.entries(params) as [string, unknown][]) {
    if (valor !== null && valor !== undefined && valor !== '') query = query.set(chave, String(valor));
  }
  const texto = query.toString();
  return texto ? `${url}?${texto}` : url;
}

/** Operações que alteram dados. As leituras usam `httpResource` direto nas telas. */
@Injectable({ providedIn: 'root' })
export class PatioApi {
  private readonly http = inject(HttpClient);

  registrarEntrada(placa: string, modeloId: number) {
    return this.http.post<Movimentacao>(`${API}/movimentacoes/entrada`, { placa, modeloId });
  }

  registrarSaida(id: number, formaPagamento: FormaPagamento) {
    return this.http.post<Movimentacao>(`${API}/movimentacoes/${id}/saida`, { formaPagamento });
  }
}

@Injectable({ providedIn: 'root' })
export class CaixaApi {
  private readonly http = inject(HttpClient);

  abrir(valorInicial: number) {
    return this.http.post<Caixa>(`${API}/caixas/abrir`, { valorInicial });
  }

  fechar() {
    return this.http.post<Caixa>(`${API}/caixas/fechar`, null);
  }
}

@Injectable({ providedIn: 'root' })
export class VeiculosApi {
  private readonly http = inject(HttpClient);

  salvarMarca(id: number | null, nome: string) {
    return id === null
      ? this.http.post<Marca>(`${API}/marcas`, { nome })
      : this.http.put<Marca>(`${API}/marcas/${id}`, { nome });
  }

  excluirMarca(id: number) {
    return this.http.delete<void>(`${API}/marcas/${id}`);
  }

  salvarModelo(id: number | null, body: ModeloRequest) {
    return id === null
      ? this.http.post<Modelo>(`${API}/modelos`, body)
      : this.http.put<Modelo>(`${API}/modelos/${id}`, body);
  }

  excluirModelo(id: number) {
    return this.http.delete<void>(`${API}/modelos/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PrecosApi {
  private readonly http = inject(HttpClient);

  atualizar(tipo: TipoVeiculo, preco: Omit<Preco, 'tipo'>) {
    return this.http.put<Preco>(`${API}/precos/${tipo}`, preco);
  }
}

@Injectable({ providedIn: 'root' })
export class RhApi {
  private readonly http = inject(HttpClient);

  salvarFuncao(id: number | null, nome: string) {
    return id === null
      ? this.http.post<Funcao>(`${API}/funcoes`, { nome })
      : this.http.put<Funcao>(`${API}/funcoes/${id}`, { nome });
  }

  excluirFuncao(id: number) {
    return this.http.delete<void>(`${API}/funcoes/${id}`);
  }

  salvarFuncionario(id: number | null, body: FuncionarioRequest) {
    return id === null
      ? this.http.post<Funcionario>(`${API}/funcionarios`, body)
      : this.http.put<Funcionario>(`${API}/funcionarios/${id}`, body);
  }

  excluirFuncionario(id: number) {
    return this.http.delete<void>(`${API}/funcionarios/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class EmpresaApi {
  private readonly http = inject(HttpClient);

  atualizar(empresa: Empresa) {
    return this.http.put<Empresa>(`${API}/empresa`, empresa);
  }
}

@Injectable({ providedIn: 'root' })
export class DemoApi {
  private readonly http = inject(HttpClient);

  /** Volta todos os dados ao estado inicial da demonstração. */
  restaurar() {
    return this.http.post<void>(`${API}/demo/reset`, null);
  }
}

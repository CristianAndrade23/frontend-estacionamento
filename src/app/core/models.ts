/** Contratos da API (backend/ em Spring Boot). Datas chegam como ISO local: `2026-10-17T14:05:00`. */

export type Perfil = 'ADMIN' | 'OPERADOR';

export interface Usuario {
  username: string;
  nome: string;
  perfil: Perfil;
}

export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: Usuario;
}

export type TipoVeiculo = 'CARRO' | 'MOTO' | 'CAMINHONETE';

export const TIPOS_VEICULO: readonly { valor: TipoVeiculo; nome: string }[] = [
  { valor: 'CARRO', nome: 'Carro' },
  { valor: 'MOTO', nome: 'Moto' },
  { valor: 'CAMINHONETE', nome: 'Caminhonete' },
];

export const nomeTipo = (tipo: TipoVeiculo) => TIPOS_VEICULO.find((t) => t.valor === tipo)?.nome ?? tipo;

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';

export const FORMAS_PAGAMENTO: readonly { valor: FormaPagamento; nome: string }[] = [
  { valor: 'PIX', nome: 'Pix' },
  { valor: 'CREDITO', nome: 'Crédito' },
  { valor: 'DEBITO', nome: 'Débito' },
  { valor: 'DINHEIRO', nome: 'Dinheiro' },
];

export const nomeForma = (forma: FormaPagamento) =>
  FORMAS_PAGAMENTO.find((f) => f.valor === forma)?.nome ?? forma;

export interface Pagina<T> {
  itens: T[];
  total: number;
  /** Começa em 0. */
  pagina: number;
  tamanho: number;
}

export interface Movimentacao {
  id: number;
  placa: string;
  modelo: { id: number; nome: string; marca: string; tipo: TipoVeiculo };
  entrada: string;
  saida: string | null;
  /** No pátio: até agora. */
  permanenciaMinutos: number;
  regime: string;
  /** No pátio: quanto pagaria se saísse agora. */
  valor: number;
  formaPagamento: FormaPagamento | null;
  noPatio: boolean;
  registradaPor: string;
  finalizadaPor: string | null;
}

export interface Marca {
  id: number;
  nome: string;
  modelos: number;
}

export interface Modelo {
  id: number;
  nome: string;
  tipo: TipoVeiculo;
  marca: { id: number; nome: string };
}

export interface ModeloRequest {
  nome: string;
  marcaId: number;
  tipo: TipoVeiculo;
}

export interface Preco {
  tipo: TipoVeiculo;
  ate15: number;
  ate30: number;
  ate45: number;
  ate60: number;
  horaAdicional: number;
}

export interface TotalForma {
  forma: FormaPagamento;
  quantidade: number;
  valor: number;
}

export interface Caixa {
  id: number;
  abertura: string;
  fechamento: string | null;
  abertoPor: string;
  fechadoPor: string | null;
  valorInicial: number;
  saidas: number;
  totalRecebido: number;
  dinheiroEmGaveta: number;
  porForma: TotalForma[];
}

export interface Empresa {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  vagas: number;
  endereco: string;
  cidade: string;
  uf: string;
  taxaDebito: number;
  taxaCredito: number;
}

export interface Funcao {
  id: number;
  nome: string;
  funcionarios: number;
}

export interface Funcionario {
  id: number;
  cpf: string;
  nome: string;
  /** `aaaa-mm-dd` */
  nascimento: string;
  admissao: string;
  funcao: { id: number; nome: string };
}

export interface FuncionarioRequest {
  cpf: string;
  nome: string;
  nascimento: string;
  admissao: string;
  funcaoId: number;
}

export interface Periodo {
  /** `aaaa-mm-dd`, inclusivo. */
  de: string;
  ate: string;
}

export interface RelatorioOperacional {
  periodo: Periodo;
  entradas: number;
  finalizadas: number;
  permanenciaMediaMinutos: number;
  porTipo: { tipo: TipoVeiculo; quantidade: number }[];
  /** 24 posições: entradas em cada hora do dia. */
  porHora: number[];
  porDia: { data: string; quantidade: number }[];
  modelos: { modelo: string; marca: string; tipo: TipoVeiculo; quantidade: number }[];
}

export interface RelatorioFinanceiro {
  periodo: Periodo;
  pagamentos: number;
  receitaBruta: number;
  taxas: number;
  receitaLiquida: number;
  ticketMedio: number;
  porForma: { forma: FormaPagamento; quantidade: number; valor: number; taxa: number }[];
  porTipo: { tipo: TipoVeiculo; quantidade: number; valor: number }[];
  porDia: { data: string; valor: number }[];
}

export interface Dashboard {
  vagas: number;
  ocupadas: number;
  livres: number;
  noPatioPorTipo: { tipo: TipoVeiculo; quantidade: number }[];
  entradasHoje: number;
  saidasHoje: number;
  faturamentoHoje: number;
  permanenciaMediaHojeMinutos: number;
  entradasPorHoraHoje: number[];
  caixa: Caixa | null;
}

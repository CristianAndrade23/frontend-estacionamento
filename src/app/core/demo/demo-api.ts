import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { calcularCobranca } from '../cobranca';
import { isoDia, somarDias } from '../datas';
import { cnpjValido, cpfValido, normalizarPlaca, placaValida, somenteDigitos } from '../documentos';
import {
  Caixa,
  Dashboard,
  FormaPagamento,
  Movimentacao,
  Perfil,
  RelatorioFinanceiro,
  RelatorioOperacional,
  TipoVeiculo,
  Usuario,
} from '../models';
import { CaixaRow, Estado, MovimentacaoRow, dataHora, gerarDados, isoDataHora, minutosEntre } from './dados';

/**
 * API do modo demo: as regras do backend Spring Boot (`backend/`) reescritas para rodar no
 * navegador, com as mesmas rotas, validações, perfis e mensagens de erro. Os dados ficam no
 * localStorage e são gerados de novo quando o dia muda, como o servidor faz ao reiniciar.
 */

const STORAGE_KEY = 'estaciona:demo-db:v1';
const TOKEN_ISSUER = 'estacionamento-demo';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
/** Ordem dos enums do backend (é a ordem usada nas listas "por forma" e "por tipo"). */
const FORMAS: FormaPagamento[] = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO'];
const TIPOS: TipoVeiculo[] = ['CARRO', 'MOTO', 'CAMINHONETE'];

class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

const naoEncontrado = (msg: string) => new ApiError(404, msg);
const conflito = (msg: string) => new ApiError(409, msg);
const invalido = (msg: string) => new ApiError(400, msg);
const REQUISICAO_INVALIDA = 'Requisição inválida';

// ---------------------------------------------------------------- persistência

let estado: Estado | null = null;

function db(): Estado {
  const hoje = isoDia(new Date());
  if (estado?.geradoEm === hoje) return estado;
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Estado | null;
    if (salvo?.geradoEm === hoje) return (estado = salvo);
  } catch {
    /* storage indisponível ou corrompido: gera de novo */
  }
  estado = gerarDados();
  salvar();
  return estado;
}

function salvar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    /* sem persistência: a demo continua funcionando em memória */
  }
}

/** Volta todos os dados ao estado inicial da demonstração. */
export function restaurarDemo(): void {
  estado = gerarDados();
  salvar();
}

const novoId = (s: Estado) => s.proximoId++;
const agora = () => {
  const d = new Date();
  d.setMilliseconds(0);
  return isoDataHora(d);
};

// ---------------------------------------------------------------- valores e validação

/** Soma em centavos, para não acumular erro de ponto flutuante (o backend usa BigDecimal). */
const centavos = (v: number) => Math.round(v * 100);
const somar = (valores: number[]) => valores.reduce((acc, v) => acc + centavos(v), 0) / 100;

/** Erros de validação como os do Bean Validation: a primeira mensagem e o erro de cada campo. */
class Validacao {
  private readonly campos: Record<string, string> = {};

  constructor(readonly body: Record<string, unknown>) {}

  erro(campo: string, mensagem: string) {
    this.campos[campo] ??= mensagem;
  }

  texto(campo: string, obrigatorio: string, max?: number, min = 0): string {
    const v = this.body[campo];
    if (v !== undefined && v !== null && typeof v !== 'string') throw invalido(REQUISICAO_INVALIDA);
    const s = (v as string | null | undefined) ?? '';
    if (!s.trim()) this.erro(campo, obrigatorio);
    else if (max !== undefined && (s.length > max || s.length < min)) {
      this.erro(campo, min ? `Entre ${min} e ${max} caracteres` : `Máximo de ${max} caracteres`);
    }
    return s;
  }

  numero(
    campo: string,
    obrigatorio: string,
    min: number,
    max: number,
    mensagens: { min?: string; max?: string } = {},
  ) {
    const v = this.body[campo];
    if (v === undefined || v === null || v === '') {
      this.erro(campo, obrigatorio);
      return 0;
    }
    if (typeof v !== 'number' || !Number.isFinite(v)) throw invalido(REQUISICAO_INVALIDA);
    if (v < min) this.erro(campo, mensagens.min ?? `Deve ser maior ou igual a ${min}`);
    else if (v > max) this.erro(campo, mensagens.max ?? `Deve ser menor ou igual a ${max}`);
    else if (centavos(v) / 100 !== v) this.erro(campo, 'Use no máximo 2 casas decimais');
    return v;
  }

  id(campo: string, obrigatorio: string): number {
    const v = this.body[campo];
    if (v === undefined || v === null) this.erro(campo, obrigatorio);
    else if (typeof v !== 'number' || !Number.isInteger(v)) throw invalido(REQUISICAO_INVALIDA);
    return v as number;
  }

  opcao<T extends string>(campo: string, obrigatorio: string, opcoes: readonly T[]): T {
    const v = this.body[campo];
    if (v === undefined || v === null) this.erro(campo, obrigatorio);
    else if (!opcoes.includes(v as T)) throw invalido(REQUISICAO_INVALIDA);
    return v as T;
  }

  data(campo: string, obrigatorio: string): string {
    const v = this.body[campo];
    if (v === undefined || v === null || v === '') {
      this.erro(campo, obrigatorio);
      return '';
    }
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw invalido(REQUISICAO_INVALIDA);
    return v;
  }

  /** Lança 400 com o primeiro erro encontrado, como o `ErrorHandler` do backend. */
  conferir() {
    const mensagens = Object.values(this.campos);
    if (mensagens.length) throw new ApiError(400, mensagens[0], this.campos);
  }
}

const corpo = (body: unknown) =>
  new Validacao((typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>);

// ---------------------------------------------------------------- autenticação

interface Sessao {
  username: string;
  nome: string;
  perfil: Perfil;
}

const base64Url = (valor: unknown) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(valor))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function lerToken(token: string): Record<string, unknown> {
  const json = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0))));
}

/** Token no formato JWT (sem assinatura: sem servidor, não há segredo para proteger). */
function login(s: Estado, body: unknown) {
  const v = corpo(body);
  const username = v.texto('username', 'Informe o usuário');
  const password = v.texto('password', 'Informe a senha');
  v.conferir();
  const usuario = s.usuarios.find(
    (u) => u.username === username.trim().toLowerCase() && u.senha === password,
  );
  if (!usuario) throw new ApiError(401, 'Usuário ou senha inválidos');

  const expiraEm = new Date(Date.now() + TOKEN_TTL_MS);
  const claims = {
    iss: TOKEN_ISSUER,
    sub: usuario.username,
    exp: Math.floor(expiraEm.getTime() / 1000),
    nome: usuario.nome,
    perfil: usuario.perfil,
  };
  const dto: Usuario = { username: usuario.username, nome: usuario.nome, perfil: usuario.perfil };
  return {
    token: `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url(claims)}.demo`,
    expiraEm: expiraEm.toISOString(),
    usuario: dto,
  };
}

function autenticar(req: HttpRequest<unknown>, s: Estado): Sessao {
  const [esquema, token] = (req.headers.get('Authorization') ?? '').split(' ');
  try {
    if (esquema !== 'Bearer' || !token) throw new Error();
    const claims = lerToken(token);
    const usuario = s.usuarios.find((u) => u.username === claims['sub']);
    if (claims['iss'] !== TOKEN_ISSUER || Number(claims['exp']) * 1000 <= Date.now() || !usuario) {
      throw new Error();
    }
    return { username: usuario.username, nome: usuario.nome, perfil: usuario.perfil };
  } catch {
    throw new ApiError(401, 'Sessão expirada ou inválida');
  }
}

/** Mesmas regras do `SecurityConfig`: o que só o administrador pode acessar. */
function exigeAdmin(metodo: string, caminho: string): boolean {
  return (
    (metodo === 'PUT' && (caminho.startsWith('/precos/') || caminho === '/empresa')) ||
    /^\/(funcoes|funcionarios)(\/|$)/.test(caminho) ||
    caminho.startsWith('/relatorios/financeiro')
  );
}

// ---------------------------------------------------------------- pátio

function modeloDe(s: Estado, id: number) {
  const modelo = s.modelos.find((m) => m.id === id)!;
  const marca = s.marcas.find((m) => m.id === modelo.marcaId)!;
  return { ...modelo, marca };
}

const precoDo = (s: Estado, tipo: TipoVeiculo) => s.precos.find((p) => p.tipo === tipo)!;

/** Enquanto o veículo está no pátio, tempo, regime e valor são calculados até `ate`. */
function movimentacaoDto(s: Estado, m: MovimentacaoRow, ate: string): Movimentacao {
  const modelo = modeloDe(s, m.modeloId);
  const noPatio = m.saida === null;
  const minutos = Math.max(0, minutosEntre(m.entrada, noPatio ? ate : m.saida!));
  const cobranca = calcularCobranca(precoDo(s, modelo.tipo), minutos);
  return {
    id: m.id,
    placa: m.placa,
    modelo: { id: modelo.id, nome: modelo.nome, marca: modelo.marca.nome, tipo: modelo.tipo },
    entrada: m.entrada,
    saida: m.saida,
    permanenciaMinutos: minutos,
    regime: cobranca.regime,
    valor: noPatio ? cobranca.valor : m.valor!,
    formaPagamento: m.formaPagamento,
    noPatio,
    registradaPor: m.registradaPor,
    finalizadaPor: m.finalizadaPor,
  };
}

function listarMovimentacoes(s: Estado, params: URLSearchParams) {
  const situacao = params.get('situacao') ?? 'PATIO';
  if (situacao !== 'PATIO' && situacao !== 'TODAS') throw invalido(REQUISICAO_INVALIDA);
  const placa = normalizarPlaca(params.get('busca') ?? '');
  const pagina = Math.max(inteiro(params.get('pagina'), 0), 0);
  const tamanho = Math.min(Math.max(inteiro(params.get('tamanho'), 10), 1), 50);

  const encontradas = s.movimentacoes
    .filter((m) => (situacao === 'TODAS' || m.saida === null) && m.placa.includes(placa))
    .sort((a, b) => b.entrada.localeCompare(a.entrada));
  const ate = agora();
  return {
    itens: encontradas.slice(pagina * tamanho, (pagina + 1) * tamanho).map((m) => movimentacaoDto(s, m, ate)),
    total: encontradas.length,
    pagina,
    tamanho,
  };
}

function registrarEntrada(s: Estado, body: unknown, sessao: Sessao) {
  const v = corpo(body);
  const placaInformada = v.texto('placa', 'Informe a placa');
  if (placaInformada.trim() && !placaValida(placaInformada)) {
    v.erro('placa', 'Placa inválida (use ABC-1234 ou ABC1D23)');
  }
  const modeloId = v.id('modeloId', 'Selecione o modelo');
  v.conferir();

  const placa = normalizarPlaca(placaInformada);
  const noPatio = s.movimentacoes.filter((m) => m.saida === null);
  if (noPatio.some((m) => m.placa === placa)) throw conflito(`O veículo ${placa} já está no pátio`);
  const vagas = s.empresa.vagas;
  if (noPatio.length >= vagas) {
    throw conflito(`Estacionamento lotado: todas as ${vagas} vagas estão ocupadas`);
  }
  if (!s.modelos.some((m) => m.id === modeloId)) throw invalido('Modelo não encontrado');

  const entrada = agora();
  const m: MovimentacaoRow = {
    id: novoId(s),
    placa,
    modeloId,
    entrada,
    registradaPor: sessao.nome,
    saida: null,
    valor: null,
    formaPagamento: null,
    caixaId: null,
    finalizadaPor: null,
  };
  s.movimentacoes.push(m);
  return movimentacaoDto(s, m, entrada);
}

function noPatio(s: Estado, id: number): MovimentacaoRow {
  const m = s.movimentacoes.find((x) => x.id === id);
  if (!m) throw naoEncontrado('Movimentação não encontrada');
  if (m.saida !== null) throw conflito(`A saída do veículo ${m.placa} já foi registrada`);
  return m;
}

function registrarSaida(s: Estado, id: number, body: unknown, sessao: Sessao) {
  const v = corpo(body);
  const forma = v.opcao('formaPagamento', 'Selecione a forma de pagamento', FORMAS);
  v.conferir();

  const m = noPatio(s, id);
  const caixa = caixaAberto(s);
  if (!caixa) throw conflito('Abra o caixa antes de registrar saídas');
  const saida = agora();
  const tipo = modeloDe(s, m.modeloId).tipo;
  m.saida = saida;
  m.valor = calcularCobranca(precoDo(s, tipo), Math.max(0, minutosEntre(m.entrada, saida))).valor;
  m.formaPagamento = forma;
  m.caixaId = caixa.id;
  m.finalizadaPor = sessao.nome;
  return movimentacaoDto(s, m, saida);
}

// ---------------------------------------------------------------- caixa

const caixaAberto = (s: Estado) => s.caixas.find((c) => c.fechamento === null);

/** Totais por forma de pagamento; todas as formas aparecem, mesmo zeradas. */
function caixaDto(s: Estado, caixa: CaixaRow): Caixa {
  const pagas = s.movimentacoes.filter((m) => m.caixaId === caixa.id);
  const porForma = FORMAS.map((forma) => {
    const daForma = pagas.filter((m) => m.formaPagamento === forma);
    return { forma, quantidade: daForma.length, valor: somar(daForma.map((m) => m.valor!)) };
  });
  const dinheiro = porForma.find((f) => f.forma === 'DINHEIRO')!.valor;
  return {
    ...caixa,
    saidas: pagas.length,
    totalRecebido: somar(porForma.map((f) => f.valor)),
    dinheiroEmGaveta: somar([caixa.valorInicial, dinheiro]),
    porForma,
  };
}

function abrirCaixa(s: Estado, body: unknown, sessao: Sessao) {
  const v = corpo(body);
  const valorInicial = v.numero('valorInicial', 'Informe o troco inicial', 0, 99999.99, {
    min: 'O troco não pode ser negativo',
  });
  v.conferir();
  if (caixaAberto(s)) throw conflito('Já existe um caixa aberto');
  const caixa: CaixaRow = {
    id: novoId(s),
    abertura: agora(),
    fechamento: null,
    abertoPor: sessao.nome,
    fechadoPor: null,
    valorInicial,
  };
  s.caixas.push(caixa);
  return caixaDto(s, caixa);
}

function fecharCaixa(s: Estado, sessao: Sessao) {
  const caixa = caixaAberto(s);
  if (!caixa) throw conflito('Não há caixa aberto');
  caixa.fechamento = agora();
  caixa.fechadoPor = sessao.nome;
  return caixaDto(s, caixa);
}

// ---------------------------------------------------------------- períodos e relatórios

interface Periodo {
  de: string;
  ate: string;
}

/** Mesmas regras do `Periodo.java`: datas inclusivas, em ordem, e no máximo 1 ano. */
function periodo(params: URLSearchParams): Periodo {
  const de = params.get('de');
  const ate = params.get('ate');
  if (!de || !ate) throw invalido('Informe o período');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(de) || !/^\d{4}-\d{2}-\d{2}$/.test(ate)) {
    throw invalido(REQUISICAO_INVALIDA);
  }
  if (ate < de) throw invalido('A data final não pode ser antes da inicial');
  if (diasEntre(de, ate) > 366) throw invalido('Escolha um período de até 1 ano');
  return { de, ate };
}

const diasEntre = (de: string, ate: string) =>
  Math.round((dataHora(ate).getTime() - dataHora(de).getTime()) / 86_400_000);

function diasDo(p: Periodo): string[] {
  const dias: string[] = [];
  for (let d = dataHora(p.de); isoDia(d) <= p.ate; d = somarDias(d, 1)) dias.push(isoDia(d));
  return dias;
}

/** `inicio` inclusivo e `fim` exclusivo (início do dia seguinte), em ISO local. */
const noPeriodo = (iso: string | null, p: Periodo) =>
  iso !== null && iso >= `${p.de}T00:00:00` && iso < `${isoDia(somarDias(dataHora(p.ate), 1))}T00:00:00`;

function operacional(s: Estado, p: Periodo): RelatorioOperacional {
  const lista = s.movimentacoes.filter((m) => noPeriodo(m.entrada, p));
  const finalizadas = lista.filter((m) => m.saida !== null);
  const permanencia = finalizadas.length
    ? Math.round(
        finalizadas.reduce((acc, m) => acc + minutosEntre(m.entrada, m.saida!), 0) / finalizadas.length,
      )
    : 0;
  const tipoDe = (m: MovimentacaoRow) => modeloDe(s, m.modeloId).tipo;

  const porHora = Array.from({ length: 24 }, () => 0);
  lista.forEach((m) => porHora[Number(m.entrada.slice(11, 13))]++);

  const porModelo = new Map<number, number>();
  lista.forEach((m) => porModelo.set(m.modeloId, (porModelo.get(m.modeloId) ?? 0) + 1));
  const modelos = [...porModelo]
    .map(([id, quantidade]) => {
      const modelo = modeloDe(s, id);
      return { modelo: modelo.nome, marca: modelo.marca.nome, tipo: modelo.tipo, quantidade };
    })
    .sort((a, b) => b.quantidade - a.quantidade || (a.modelo < b.modelo ? -1 : a.modelo > b.modelo ? 1 : 0))
    .slice(0, 5);

  return {
    periodo: p,
    entradas: lista.length,
    finalizadas: finalizadas.length,
    permanenciaMediaMinutos: permanencia,
    porTipo: TIPOS.map((tipo) => ({ tipo, quantidade: lista.filter((m) => tipoDe(m) === tipo).length })),
    porHora,
    porDia: diasDo(p).map((data) => ({
      data,
      quantidade: lista.filter((m) => m.entrada.startsWith(data)).length,
    })),
    modelos,
  };
}

function financeiro(s: Estado, p: Periodo): RelatorioFinanceiro {
  const pagas = s.movimentacoes.filter((m) => noPeriodo(m.saida, p));
  const taxaPercentual: Partial<Record<FormaPagamento, number>> = {
    DEBITO: s.empresa.taxaDebito,
    CREDITO: s.empresa.taxaCredito,
  };
  const porForma = FORMAS.map((forma) => {
    const daForma = pagas.filter((m) => m.formaPagamento === forma);
    const valor = somar(daForma.map((m) => m.valor!));
    // valor × taxa ÷ 100, arredondado para centavos (HALF_UP), em inteiros para ser exato.
    const taxa = Math.round((centavos(valor) * centavos(taxaPercentual[forma] ?? 0)) / 10_000) / 100;
    return { forma, quantidade: daForma.length, valor, taxa };
  }).sort((a, b) => b.valor - a.valor);

  const bruta = somar(pagas.map((m) => m.valor!));
  const taxas = somar(porForma.map((f) => f.taxa));
  return {
    periodo: p,
    pagamentos: pagas.length,
    receitaBruta: bruta,
    taxas,
    receitaLiquida: somar([bruta, -taxas]),
    ticketMedio: pagas.length ? Math.round(centavos(bruta) / pagas.length) / 100 : 0,
    porForma,
    porTipo: TIPOS.map((tipo) => {
      const doTipo = pagas.filter((m) => modeloDe(s, m.modeloId).tipo === tipo);
      return { tipo, quantidade: doTipo.length, valor: somar(doTipo.map((m) => m.valor!)) };
    }),
    porDia: diasDo(p).map((data) => ({
      data,
      valor: somar(pagas.filter((m) => m.saida!.startsWith(data)).map((m) => m.valor!)),
    })),
  };
}

function dashboard(s: Estado): Dashboard {
  const hoje = isoDia(new Date());
  const op = operacional(s, { de: hoje, ate: hoje });
  const fin = financeiro(s, { de: hoje, ate: hoje });
  const noPatio = s.movimentacoes.filter((m) => m.saida === null);
  const noPatioPorTipo = TIPOS.map((tipo) => ({
    tipo,
    quantidade: noPatio.filter((m) => modeloDe(s, m.modeloId).tipo === tipo).length,
  }));
  const caixa = caixaAberto(s);
  return {
    vagas: s.empresa.vagas,
    ocupadas: noPatio.length,
    livres: Math.max(0, s.empresa.vagas - noPatio.length),
    noPatioPorTipo,
    entradasHoje: op.entradas,
    saidasHoje: fin.pagamentos,
    faturamentoHoje: fin.receitaBruta,
    permanenciaMediaHojeMinutos: op.permanenciaMediaMinutos,
    entradasPorHoraHoje: op.porHora,
    caixa: caixa ? caixaDto(s, caixa) : null,
  };
}

// ---------------------------------------------------------------- cadastros

const porNome = <T extends { nome: string }>(a: T, b: T) => a.nome.localeCompare(b.nome, 'pt-BR');
const mesmoNome = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function listarMarcas(s: Estado) {
  return [...s.marcas]
    .sort(porNome)
    .map((m) => ({ ...m, modelos: s.modelos.filter((x) => x.marcaId === m.id).length }));
}

function salvarMarca(s: Estado, id: number | null, body: unknown) {
  const v = corpo(body);
  const nome = v.texto('nome', 'Informe o nome da marca', 40).trim();
  v.conferir();
  const marca = id === null ? null : s.marcas.find((m) => m.id === id);
  if (id !== null && !marca) throw naoEncontrado('Marca não encontrada');
  if (s.marcas.some((m) => m.id !== id && mesmoNome(m.nome, nome)))
    throw conflito(`Já existe a marca ${nome}`);
  if (marca) {
    marca.nome = nome;
    return { ...marca, modelos: s.modelos.filter((x) => x.marcaId === marca.id).length };
  }
  const nova = { id: novoId(s), nome };
  s.marcas.push(nova);
  return { ...nova, modelos: 0 };
}

function excluirMarca(s: Estado, id: number) {
  const marca = s.marcas.find((m) => m.id === id);
  if (!marca) throw naoEncontrado('Marca não encontrada');
  const quantidade = s.modelos.filter((m) => m.marcaId === id).length;
  if (quantidade > 0) {
    throw conflito(
      `A marca ${marca.nome} tem ${plural(quantidade, 'modelo cadastrado', 'modelos cadastrados')}; exclua-os antes`,
    );
  }
  s.marcas = s.marcas.filter((m) => m.id !== id);
}

function modeloDto(s: Estado, id: number) {
  const m = modeloDe(s, id);
  return { id: m.id, nome: m.nome, tipo: m.tipo, marca: { id: m.marca.id, nome: m.marca.nome } };
}

function listarModelos(s: Estado) {
  return s.modelos.map((m) => modeloDto(s, m.id)).sort((a, b) => porNome(a.marca, b.marca) || porNome(a, b));
}

function salvarModelo(s: Estado, id: number | null, body: unknown) {
  const v = corpo(body);
  const nome = v.texto('nome', 'Informe o nome do modelo', 40).trim();
  const marcaId = v.id('marcaId', 'Selecione a marca');
  const tipo = v.opcao('tipo', 'Selecione o tipo de veículo', TIPOS);
  v.conferir();

  const modelo = id === null ? null : s.modelos.find((m) => m.id === id);
  if (id !== null && !modelo) throw naoEncontrado('Modelo não encontrado');
  const marca = s.marcas.find((m) => m.id === marcaId);
  if (!marca) throw invalido('Marca não encontrada');
  if (s.modelos.some((m) => m.id !== id && m.marcaId === marcaId && mesmoNome(m.nome, nome))) {
    throw conflito(`A marca ${marca.nome} já tem o modelo ${nome}`);
  }
  if (modelo) {
    Object.assign(modelo, { nome, marcaId, tipo });
    return modeloDto(s, modelo.id);
  }
  const novo = { id: novoId(s), nome, marcaId, tipo };
  s.modelos.push(novo);
  return modeloDto(s, novo.id);
}

function excluirModelo(s: Estado, id: number) {
  const modelo = s.modelos.find((m) => m.id === id);
  if (!modelo) throw naoEncontrado('Modelo não encontrado');
  if (s.movimentacoes.some((m) => m.modeloId === id)) {
    throw conflito(`O modelo ${modelo.nome} já tem movimentações no pátio e não pode ser excluído`);
  }
  s.modelos = s.modelos.filter((m) => m.id !== id);
}

function atualizarPreco(s: Estado, tipo: string, body: unknown) {
  if (!TIPOS.includes(tipo as TipoVeiculo)) throw invalido(REQUISICAO_INVALIDA);
  const v = corpo(body);
  const valores = {
    ate15: v.numero('ate15', 'Informe o valor até 15 min', 0, 9999.99),
    ate30: v.numero('ate30', 'Informe o valor até 30 min', 0, 9999.99),
    ate45: v.numero('ate45', 'Informe o valor até 45 min', 0, 9999.99),
    ate60: v.numero('ate60', 'Informe o valor até 1 h', 0, 9999.99),
    horaAdicional: v.numero('horaAdicional', 'Informe o valor da hora adicional', 0, 9999.99),
  };
  v.conferir();
  const faixas = [valores.ate15, valores.ate30, valores.ate45, valores.ate60];
  if (faixas.some((f, i) => i > 0 && f < faixas[i - 1])) {
    throw invalido('O valor de cada faixa não pode ser menor que o da faixa anterior');
  }
  const preco = precoDo(s, tipo as TipoVeiculo);
  Object.assign(preco, valores);
  return preco;
}

function atualizarEmpresa(s: Estado, body: unknown) {
  const v = corpo(body);
  const razaoSocial = v.texto('razaoSocial', 'Informe a razão social', 120);
  const nomeFantasia = v.texto('nomeFantasia', 'Informe o nome fantasia', 60);
  const cnpj = v.texto('cnpj', 'Informe o CNPJ');
  if (cnpj.trim() && !cnpjValido(cnpj)) v.erro('cnpj', 'CNPJ inválido');
  const vagasInformadas = v.body['vagas'];
  if (vagasInformadas !== undefined && vagasInformadas !== null && !Number.isInteger(vagasInformadas)) {
    throw invalido(REQUISICAO_INVALIDA);
  }
  const vagas = v.numero('vagas', 'Informe o número de vagas', 1, 2000, {
    min: 'Mínimo de 1 vaga',
    max: 'Máximo de 2000 vagas',
  });
  const endereco = v.texto('endereco', 'Informe o endereço', 120);
  const cidade = v.texto('cidade', 'Informe a cidade', 60);
  const uf = v.texto('uf', 'Informe a UF');
  if (uf.trim() && !/^[A-Z]{2}$/.test(uf)) v.erro('uf', 'UF inválida');
  const taxaDebito = v.numero('taxaDebito', 'Informe a taxa do débito', 0, 20, { max: 'Máximo de 20%' });
  const taxaCredito = v.numero('taxaCredito', 'Informe a taxa do crédito', 0, 20, { max: 'Máximo de 20%' });
  v.conferir();

  const noPatio = s.movimentacoes.filter((m) => m.saida === null).length;
  if (vagas < noPatio) {
    throw invalido(`Há ${noPatio} veículos no pátio; o número de vagas não pode ser menor`);
  }
  s.empresa = {
    razaoSocial: razaoSocial.trim(),
    nomeFantasia: nomeFantasia.trim(),
    cnpj: somenteDigitos(cnpj),
    vagas,
    endereco: endereco.trim(),
    cidade: cidade.trim(),
    uf,
    taxaDebito,
    taxaCredito,
  };
  return s.empresa;
}

// ---------------------------------------------------------------- RH

const IDADE_MINIMA = 16;

function listarFuncoes(s: Estado) {
  return [...s.funcoes]
    .sort(porNome)
    .map((f) => ({ ...f, funcionarios: s.funcionarios.filter((x) => x.funcaoId === f.id).length }));
}

function salvarFuncao(s: Estado, id: number | null, body: unknown) {
  const v = corpo(body);
  const nome = v.texto('nome', 'Informe o nome da função', 40).trim();
  v.conferir();
  const funcao = id === null ? null : s.funcoes.find((f) => f.id === id);
  if (id !== null && !funcao) throw naoEncontrado('Função não encontrada');
  if (s.funcoes.some((f) => f.id !== id && mesmoNome(f.nome, nome)))
    throw conflito(`Já existe a função ${nome}`);
  if (funcao) {
    funcao.nome = nome;
    return { ...funcao, funcionarios: s.funcionarios.filter((x) => x.funcaoId === funcao.id).length };
  }
  const nova = { id: novoId(s), nome };
  s.funcoes.push(nova);
  return { ...nova, funcionarios: 0 };
}

function excluirFuncao(s: Estado, id: number) {
  const funcao = s.funcoes.find((f) => f.id === id);
  if (!funcao) throw naoEncontrado('Função não encontrada');
  const quantidade = s.funcionarios.filter((f) => f.funcaoId === id).length;
  if (quantidade > 0) {
    throw conflito(
      `A função ${funcao.nome} está atribuída a ${plural(quantidade, 'funcionário', 'funcionários')}`,
    );
  }
  s.funcoes = s.funcoes.filter((f) => f.id !== id);
}

function funcionarioDto(s: Estado, f: Estado['funcionarios'][number]) {
  const funcao = s.funcoes.find((x) => x.id === f.funcaoId)!;
  const { funcaoId: _, ...dados } = f;
  return { ...dados, funcao: { id: funcao.id, nome: funcao.nome } };
}

function salvarFuncionario(s: Estado, id: number | null, body: unknown) {
  const v = corpo(body);
  const cpfInformado = v.texto('cpf', 'Informe o CPF');
  if (cpfInformado.trim() && !cpfValido(cpfInformado)) v.erro('cpf', 'CPF inválido');
  const nome = v.texto('nome', 'Informe o nome', 80, 3);
  const nascimento = v.data('nascimento', 'Informe a data de nascimento');
  const admissao = v.data('admissao', 'Informe a data de admissão');
  const hoje = isoDia(new Date());
  if (nascimento && nascimento >= hoje) v.erro('nascimento', 'A data de nascimento deve estar no passado');
  if (admissao && admissao > hoje) v.erro('admissao', 'A admissão não pode ser no futuro');
  const funcaoId = v.id('funcaoId', 'Selecione a função');
  v.conferir();

  const funcionario = id === null ? null : s.funcionarios.find((f) => f.id === id);
  if (id !== null && !funcionario) throw naoEncontrado('Funcionário não encontrado');
  const cpf = somenteDigitos(cpfInformado);
  if (s.funcionarios.some((f) => f.id !== id && f.cpf === cpf)) {
    throw conflito('Já existe um funcionário com este CPF');
  }
  const [ano, mes, dia] = nascimento.split('-').map(Number);
  if (admissao < isoDia(new Date(ano + IDADE_MINIMA, mes - 1, dia))) {
    throw invalido(`O funcionário precisa ter pelo menos ${IDADE_MINIMA} anos na admissão`);
  }
  if (!s.funcoes.some((f) => f.id === funcaoId)) throw invalido('Função não encontrada');

  const dados = { cpf, nome: nome.trim(), nascimento, admissao, funcaoId };
  if (funcionario) {
    Object.assign(funcionario, dados);
    return funcionarioDto(s, funcionario);
  }
  const novo = { id: novoId(s), ...dados };
  s.funcionarios.push(novo);
  return funcionarioDto(s, novo);
}

function excluirFuncionario(s: Estado, id: number) {
  if (!s.funcionarios.some((f) => f.id === id)) throw naoEncontrado('Funcionário não encontrado');
  s.funcionarios = s.funcionarios.filter((f) => f.id !== id);
}

// ---------------------------------------------------------------- rotas

interface Resultado {
  status: number;
  body: unknown;
}

const ok = (body: unknown, status = 200): Resultado => ({ status, body });
const semConteudo: Resultado = { status: 204, body: null };

function inteiro(valor: string | null, padrao: number): number {
  if (valor === null || valor === '') return padrao;
  if (!/^-?\d+$/.test(valor)) throw invalido(REQUISICAO_INVALIDA);
  return Number(valor);
}

function idDaRota(valor: string): number {
  if (!/^\d+$/.test(valor)) throw invalido(REQUISICAO_INVALIDA);
  return Number(valor);
}

function rotear(req: HttpRequest<unknown>, caminho: string): Resultado {
  const s = db();
  const metodo = req.method;
  const params = new URLSearchParams(req.urlWithParams.split('?')[1] ?? '');
  const partes = caminho.split('/').filter(Boolean).map(decodeURIComponent);

  // Rotas públicas
  if (metodo === 'POST' && caminho === '/auth/login') return ok(login(s, req.body));
  if (metodo === 'POST' && caminho === '/demo/reset') {
    restaurarDemo();
    return semConteudo;
  }

  const sessao = autenticar(req, s);
  if (exigeAdmin(metodo, caminho) && sessao.perfil !== 'ADMIN') {
    throw new ApiError(403, 'Seu perfil não tem acesso a este recurso');
  }

  const [recurso, segundo, terceiro] = partes;
  const rota = `${metodo} /${recurso ?? ''}${segundo !== undefined ? '/:x' : ''}${terceiro !== undefined ? '/' + terceiro : ''}`;

  switch (rota) {
    case 'GET /auth/:x':
      if (segundo === 'me')
        return ok({ username: sessao.username, nome: sessao.nome, perfil: sessao.perfil });
      break;
    case 'GET /dashboard':
      return ok(dashboard(s));

    case 'GET /movimentacoes':
      return ok(listarMovimentacoes(s, params));
    case 'POST /movimentacoes/:x':
      if (segundo === 'entrada') return ok(registrarEntrada(s, req.body, sessao), 201);
      break;
    case 'GET /movimentacoes/:x/previa-saida':
      return ok(movimentacaoDto(s, noPatio(s, idDaRota(segundo)), agora()));
    case 'POST /movimentacoes/:x/saida':
      return ok(registrarSaida(s, idDaRota(segundo), req.body, sessao));

    case 'GET /caixas': {
      const p = periodo(params);
      return ok(
        s.caixas
          .filter((c) => noPeriodo(c.abertura, p))
          .sort((a, b) => b.abertura.localeCompare(a.abertura))
          .map((c) => caixaDto(s, c)),
      );
    }
    case 'GET /caixas/:x':
      if (segundo === 'atual') {
        const caixa = caixaAberto(s);
        return caixa ? ok(caixaDto(s, caixa)) : semConteudo;
      }
      break;
    case 'POST /caixas/:x':
      if (segundo === 'abrir') return ok(abrirCaixa(s, req.body, sessao));
      if (segundo === 'fechar') return ok(fecharCaixa(s, sessao));
      break;

    case 'GET /precos':
      return ok([...s.precos].sort((a, b) => TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo)));
    case 'PUT /precos/:x':
      return ok(atualizarPreco(s, segundo, req.body));

    case 'GET /marcas':
      return ok(listarMarcas(s));
    case 'POST /marcas':
      return ok(salvarMarca(s, null, req.body), 201);
    case 'PUT /marcas/:x':
      return ok(salvarMarca(s, idDaRota(segundo), req.body));
    case 'DELETE /marcas/:x':
      excluirMarca(s, idDaRota(segundo));
      return semConteudo;

    case 'GET /modelos':
      return ok(listarModelos(s));
    case 'POST /modelos':
      return ok(salvarModelo(s, null, req.body), 201);
    case 'PUT /modelos/:x':
      return ok(salvarModelo(s, idDaRota(segundo), req.body));
    case 'DELETE /modelos/:x':
      excluirModelo(s, idDaRota(segundo));
      return semConteudo;

    case 'GET /funcoes':
      return ok(listarFuncoes(s));
    case 'POST /funcoes':
      return ok(salvarFuncao(s, null, req.body), 201);
    case 'PUT /funcoes/:x':
      return ok(salvarFuncao(s, idDaRota(segundo), req.body));
    case 'DELETE /funcoes/:x':
      excluirFuncao(s, idDaRota(segundo));
      return semConteudo;

    case 'GET /funcionarios':
      return ok([...s.funcionarios].sort(porNome).map((f) => funcionarioDto(s, f)));
    case 'POST /funcionarios':
      return ok(salvarFuncionario(s, null, req.body), 201);
    case 'PUT /funcionarios/:x':
      return ok(salvarFuncionario(s, idDaRota(segundo), req.body));
    case 'DELETE /funcionarios/:x':
      excluirFuncionario(s, idDaRota(segundo));
      return semConteudo;

    case 'GET /empresa':
      return ok(s.empresa);
    case 'PUT /empresa':
      return ok(atualizarEmpresa(s, req.body));

    case 'GET /relatorios/:x':
      if (segundo === 'operacional') return ok(operacional(s, periodo(params)));
      if (segundo === 'financeiro') return ok(financeiro(s, periodo(params)));
      break;
  }
  throw naoEncontrado('Recurso não encontrado');
}

/** Responde uma chamada à API; `caminho` é relativo ao prefixo da API (ex.: `/caixas/atual`). */
export async function responder(req: HttpRequest<unknown>, caminho: string): Promise<HttpEvent<unknown>> {
  try {
    const { status, body } = rotear(req, caminho);
    if (req.method !== 'GET') salvar();
    // Cópia: as telas não podem alterar os dados da "API" por referência.
    return new HttpResponse({ status, url: req.url, body: structuredClone(body) });
  } catch (e) {
    const erro = e instanceof ApiError ? e : new ApiError(500, 'Erro inesperado no servidor');
    const corpoErro = {
      status: erro.status,
      message: erro.message,
      ...(Object.keys(erro.campos).length ? { campos: erro.campos } : {}),
    };
    throw new HttpErrorResponse({ status: erro.status, url: req.url, error: corpoErro });
  }
}

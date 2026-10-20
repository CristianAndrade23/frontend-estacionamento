import { calcularCobranca } from '../cobranca';
import { isoDia, somarDias } from '../datas';
import { completarCnpj, completarCpf } from '../documentos';
import { Empresa, FormaPagamento, Perfil, Preco, TipoVeiculo } from '../models';
import { JavaRandom } from './java-random';

/** "Banco" do modo demo: as mesmas tabelas do backend, com as relações por id. */
export interface Estado {
  /** Dia em que os dados foram gerados (`aaaa-mm-dd`); em outro dia, a demo é gerada de novo. */
  geradoEm: string;
  proximoId: number;
  usuarios: { username: string; senha: string; nome: string; perfil: Perfil }[];
  empresa: Empresa;
  precos: Preco[];
  marcas: { id: number; nome: string }[];
  modelos: { id: number; nome: string; marcaId: number; tipo: TipoVeiculo }[];
  funcoes: { id: number; nome: string }[];
  funcionarios: {
    id: number;
    cpf: string;
    nome: string;
    nascimento: string;
    admissao: string;
    funcaoId: number;
  }[];
  caixas: CaixaRow[];
  movimentacoes: MovimentacaoRow[];
}

export interface CaixaRow {
  id: number;
  abertura: string;
  fechamento: string | null;
  abertoPor: string;
  fechadoPor: string | null;
  valorInicial: number;
}

export interface MovimentacaoRow {
  id: number;
  placa: string;
  modeloId: number;
  entrada: string;
  registradaPor: string;
  saida: string | null;
  valor: number | null;
  formaPagamento: FormaPagamento | null;
  caixaId: number | null;
  finalizadaPor: string | null;
}

// ---------------------------------------------------------------- datas e horas locais

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → `aaaa-mm-ddThh:mm:ss` (hora local, como o `LocalDateTime` do backend). */
export const isoDataHora = (d: Date) =>
  `${isoDia(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** `aaaa-mm-ddThh:mm:ss` → Date na hora local. */
export function dataHora(iso: string): Date {
  const [data, hora = '00:00:00'] = iso.split('T');
  const [ano, mes, dia] = data.split('-').map(Number);
  const [h, m, s = 0] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, h, m, s);
}

/** Minutos completos entre duas datas, como `Duration.between(a, b).toMinutes()`. */
export const minutosEntre = (a: Date | string, b: Date | string) =>
  Math.trunc(
    ((b instanceof Date ? b : dataHora(b)).getTime() - (a instanceof Date ? a : dataHora(a)).getTime()) /
      60_000,
  );

const maisMinutos = (d: Date, minutos: number) => {
  const copia = new Date(d);
  copia.setMinutes(copia.getMinutes() + minutos);
  return copia;
};

const comSegundos = (d: Date, segundos: number) => {
  const copia = new Date(d);
  copia.setSeconds(segundos);
  return copia;
};

const noHorario = (dia: Date, hora: number, minuto: number) =>
  new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hora, minuto, 0);

// ---------------------------------------------------------------- dados de demonstração

/** Mesmos valores de `demo/DemoData.java`. */
export const DIAS_DE_HISTORICO = 45;
export const VAGAS = 40;
export const VEICULOS_NO_PATIO = 17;
const ADMIN = 'Ana Ribeiro';
const OPERADOR = 'Carlos Lima';

/** Peso de cada hora de entrada (7h às 20h): picos no início da manhã, no almoço e no fim da tarde. */
const PESO_POR_HORA = [3, 8, 7, 5, 5, 7, 7, 5, 4, 5, 7, 8, 5, 3];

const MODELOS: [string, [string, TipoVeiculo][]][] = [
  [
    'Chevrolet',
    [
      ['Onix', 'CARRO'],
      ['Tracker', 'CARRO'],
      ['S10', 'CAMINHONETE'],
    ],
  ],
  [
    'Fiat',
    [
      ['Argo', 'CARRO'],
      ['Mobi', 'CARRO'],
      ['Strada', 'CAMINHONETE'],
      ['Toro', 'CAMINHONETE'],
    ],
  ],
  [
    'Volkswagen',
    [
      ['Gol', 'CARRO'],
      ['Polo', 'CARRO'],
      ['T-Cross', 'CARRO'],
      ['Amarok', 'CAMINHONETE'],
    ],
  ],
  [
    'Toyota',
    [
      ['Corolla', 'CARRO'],
      ['Hilux', 'CAMINHONETE'],
    ],
  ],
  [
    'Hyundai',
    [
      ['HB20', 'CARRO'],
      ['Creta', 'CARRO'],
    ],
  ],
  [
    'Honda',
    [
      ['Civic', 'CARRO'],
      ['CG 160', 'MOTO'],
      ['Biz 125', 'MOTO'],
      ['CB 500F', 'MOTO'],
    ],
  ],
  [
    'Yamaha',
    [
      ['Fazer 250', 'MOTO'],
      ['Factor 150', 'MOTO'],
    ],
  ],
  [
    'Renault',
    [
      ['Kwid', 'CARRO'],
      ['Duster', 'CARRO'],
    ],
  ],
  ['Ford', [['Ranger', 'CAMINHONETE']]],
  [
    'Jeep',
    [
      ['Renegade', 'CARRO'],
      ['Compass', 'CARRO'],
    ],
  ],
];

const FUNCOES = ['Gerente', 'Operador de caixa', 'Manobrista', 'Segurança', 'Auxiliar de limpeza'];

/** Nome e índice da função em `FUNCOES`. */
const FUNCIONARIOS: [string, number][] = [
  ['Ana Ribeiro', 0],
  ['Carlos Lima', 1],
  ['Juliana Martins', 1],
  ['Rafael Souza', 2],
  ['Diego Fernandes', 2],
  ['Marcos Pereira', 2],
  ['Patrícia Gomes', 3],
  ['Roberto Alves', 3],
  ['Sandra Oliveira', 4],
  ['Tiago Carvalho', 1],
];

/**
 * Gera a demonstração a partir de "agora", na mesma ordem de sorteios do `DemoData.java`:
 * 45 dias de caixas e movimentações, o caixa de hoje aberto e veículos no pátio.
 */
export function gerarDados(agoraReal = new Date()): Estado {
  const random = new JavaRandom(2019);
  const agora = new Date(agoraReal);
  agora.setSeconds(0, 0);
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  let id = 1;
  const novoId = () => id++;

  const precos: Preco[] = [
    { tipo: 'CARRO', ate15: 8, ate30: 10, ate45: 15, ate60: 20, horaAdicional: 6 },
    { tipo: 'MOTO', ate15: 5, ate30: 6, ate45: 8, ate60: 10, horaAdicional: 4 },
    { tipo: 'CAMINHONETE', ate15: 10, ate30: 13, ate45: 18, ate60: 24, horaAdicional: 8 },
  ];

  // Veículos
  const marcas: Estado['marcas'] = [];
  const modelos: Estado['modelos'] = [];
  for (const [nomeMarca, lista] of MODELOS) {
    const marca = { id: novoId(), nome: nomeMarca };
    marcas.push(marca);
    for (const [nome, tipo] of lista) modelos.push({ id: 0, nome, marcaId: marca.id, tipo });
  }
  modelos.forEach((m) => (m.id = novoId()));
  const modelosPorTipo = (tipo: TipoVeiculo) => modelos.filter((m) => m.tipo === tipo);

  // Equipe
  const funcoes = FUNCOES.map((nome) => ({ id: novoId(), nome }));
  const funcionarios: Estado['funcionarios'] = FUNCIONARIOS.map(([nome, funcao], i) => {
    const cpf = completarCpf(String(random.nextInt(1_000_000_000)).padStart(9, '0'));
    // Dois aniversariantes no mês atual, para o relatório de RH sempre ter o que mostrar.
    const mes = i < 2 ? hoje.getMonth() : random.nextInt(12);
    const nascimento = new Date(1970 + random.nextInt(33), mes, 1 + random.nextInt(28));
    const maisCedo = new Date(nascimento.getFullYear() + 18, nascimento.getMonth(), nascimento.getDate());
    let admissao = somarDias(hoje, -(30 + random.nextInt(8 * 365)));
    if (admissao < maisCedo) admissao = maisCedo;
    return {
      id: 0,
      cpf,
      nome,
      nascimento: isoDia(nascimento),
      admissao: isoDia(admissao),
      funcaoId: funcoes[funcao].id,
    };
  });
  funcionarios.forEach((f) => (f.id = novoId()));

  // Movimento
  const caixas: CaixaRow[] = [];
  const movimentacoes: MovimentacaoRow[] = [];

  const sortearModelo = () => {
    const p = random.nextDouble();
    const lista = modelosPorTipo(p < 0.7 ? 'CARRO' : p < 0.84 ? 'MOTO' : 'CAMINHONETE');
    return lista[random.nextInt(lista.length)];
  };

  const finalizada = (entrada: Date, saida: Date, caixa: CaixaRow, responsavel: string) => {
    const modelo = sortearModelo();
    const placa = sortearPlaca(random);
    const preco = precos.find((p) => p.tipo === modelo.tipo)!;
    const valor = calcularCobranca(preco, minutosEntre(entrada, saida)).valor;
    movimentacoes.push({
      id: 0,
      placa,
      modeloId: modelo.id,
      entrada: isoDataHora(entrada),
      registradaPor: responsavel,
      saida: isoDataHora(saida),
      valor,
      formaPagamento: sortearForma(random),
      caixaId: caixa.id,
      finalizadaPor: responsavel,
    });
  };

  // Histórico: um caixa por dia, das 7h às 22h, com todas as saídas registradas nele.
  for (let d = DIAS_DE_HISTORICO; d >= 1; d--) {
    const dia = somarDias(hoje, -d);
    const responsavel = d % 2 === 0 ? ADMIN : OPERADOR;
    const abertura = noHorario(dia, 7, random.nextInt(10));
    const fechamento = noHorario(dia, 22, random.nextInt(15));
    const caixa: CaixaRow = {
      id: novoId(),
      abertura: isoDataHora(abertura),
      fechamento: isoDataHora(fechamento),
      abertoPor: responsavel,
      fechadoPor: responsavel,
      valorInicial: 150,
    };
    caixas.push(caixa);

    const fimDeSemana = dia.getDay() === 6 || dia.getDay() === 0;
    const quantidade = fimDeSemana ? 14 + random.nextInt(14) : 34 + random.nextInt(26);
    const ultimaSaida = noHorario(dia, 21, 55);
    for (let i = 0; i < quantidade; i++) {
      const hora = horaDeEntrada(random);
      let entrada = comSegundos(noHorario(dia, hora, random.nextInt(60)), random.nextInt(60));
      if (entrada < abertura) entrada = maisMinutos(abertura, 1);
      let saida = comSegundos(maisMinutos(entrada, permanencia(random)), random.nextInt(60));
      if (saida > ultimaSaida) saida = maisMinutos(ultimaSaida, -random.nextInt(20));
      finalizada(entrada, saida, caixa, responsavel);
    }
  }

  // Hoje: caixa aberto há cerca de 5 horas, algumas saídas já registradas e o pátio ocupado.
  const aberturaHoje = maisMinutos(agora, -300 - random.nextInt(30));
  const caixaHoje: CaixaRow = {
    id: novoId(),
    abertura: isoDataHora(aberturaHoje),
    fechamento: null,
    abertoPor: OPERADOR,
    fechadoPor: null,
    valorInicial: 150,
  };
  caixas.push(caixaHoje);
  const minutosDeCaixa = minutosEntre(aberturaHoje, agora);
  for (let i = 0; i < 12; i++) {
    const entrada = maisMinutos(aberturaHoje, random.nextInt(minutosDeCaixa - 70));
    const saida = maisMinutos(entrada, 8 + random.nextInt(60));
    finalizada(entrada, saida, caixaHoje, OPERADOR);
  }

  const placasNoPatio = new Set<string>();
  while (placasNoPatio.size < VEICULOS_NO_PATIO) {
    const placa = sortearPlaca(random);
    if (placasNoPatio.has(placa)) continue;
    placasNoPatio.add(placa);
    const entrada = comSegundos(maisMinutos(agora, -(3 + random.nextInt(240))), random.nextInt(60));
    movimentacoes.push({
      id: 0,
      placa,
      modeloId: sortearModelo().id,
      entrada: isoDataHora(entrada),
      registradaPor: OPERADOR,
      saida: null,
      valor: null,
      formaPagamento: null,
      caixaId: null,
      finalizadaPor: null,
    });
  }
  movimentacoes.forEach((m) => (m.id = novoId()));

  return {
    geradoEm: isoDia(hoje),
    proximoId: id,
    usuarios: [
      { username: 'admin', senha: 'admin123', nome: ADMIN, perfil: 'ADMIN' },
      { username: 'operador', senha: 'operador123', nome: OPERADOR, perfil: 'OPERADOR' },
    ],
    empresa: {
      razaoSocial: 'Estaciona Centro Serviços de Estacionamento Ltda.',
      nomeFantasia: 'Estaciona Centro',
      cnpj: completarCnpj('283746190001'),
      vagas: VAGAS,
      endereco: 'Rua dos Andradas, 1200 - Centro Histórico',
      cidade: 'Porto Alegre',
      uf: 'RS',
      taxaDebito: 1.49,
      taxaCredito: 3.19,
    },
    precos,
    marcas,
    modelos,
    funcoes,
    funcionarios,
    caixas,
    movimentacoes,
  };
}

function horaDeEntrada(random: JavaRandom): number {
  const total = PESO_POR_HORA.reduce((a, b) => a + b, 0);
  let sorteio = random.nextInt(total);
  for (let i = 0; i < PESO_POR_HORA.length; i++) {
    sorteio -= PESO_POR_HORA[i];
    if (sorteio < 0) return 7 + i;
  }
  return 20;
}

/** Minutos de permanência: um terço até 1 hora, metade entre 1 e 4 horas, o resto até 10 horas. */
function permanencia(random: JavaRandom): number {
  const p = random.nextDouble();
  if (p < 0.35) return 5 + random.nextInt(56);
  if (p < 0.85) return 61 + random.nextInt(180);
  return 241 + random.nextInt(360);
}

function sortearForma(random: JavaRandom): FormaPagamento {
  const p = random.nextDouble();
  if (p < 0.36) return 'PIX';
  if (p < 0.62) return 'CREDITO';
  if (p < 0.85) return 'DEBITO';
  return 'DINHEIRO';
}

const LETRA = (random: JavaRandom) => String.fromCharCode(65 + random.nextInt(26));

/** Placa Mercosul (ABC1D23) em 70% dos casos; no padrão antigo (ABC1234) nos demais. */
function sortearPlaca(random: JavaRandom): string {
  let placa = LETRA(random) + LETRA(random) + LETRA(random);
  placa += random.nextInt(10);
  placa += random.nextDouble() < 0.7 ? LETRA(random) : String(random.nextInt(10));
  placa += String(random.nextInt(100)).padStart(2, '0');
  return placa;
}

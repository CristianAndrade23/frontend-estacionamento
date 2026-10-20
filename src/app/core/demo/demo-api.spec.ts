import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { cpfValido } from '../documentos';
import { Caixa, Dashboard, LoginResponse, Movimentacao, Pagina } from '../models';
import { VEICULOS_NO_PATIO, gerarDados } from './dados';
import { restaurarDemo } from './demo-api';
import { demoApiInterceptor } from './demo-api.interceptor';

describe('Dados de demonstração', () => {
  it('são determinísticos para o mesmo instante', () => {
    const instante = new Date(2026, 9, 20, 14, 30);
    expect(gerarDados(instante)).toEqual(gerarDados(instante));
  });

  it('têm o caixa de hoje aberto, o pátio ocupado e a equipe com CPFs válidos', () => {
    const dados = gerarDados(new Date(2026, 9, 20, 14, 30));
    expect(dados.caixas.filter((c) => c.fechamento === null)).toHaveLength(1);
    expect(dados.caixas).toHaveLength(46);
    expect(dados.movimentacoes.filter((m) => m.saida === null)).toHaveLength(VEICULOS_NO_PATIO);
    expect(dados.funcionarios).toHaveLength(10);
    expect(dados.funcionarios.every((f) => cpfValido(f.cpf))).toBe(true);
  });
});

describe('API do modo demo', () => {
  let http: HttpClient;

  const auth = (token?: string) => (token ? { Authorization: `Bearer ${token}` } : undefined);
  const get = <T>(url: string, token?: string) =>
    firstValueFrom(http.get<T>(`/api${url}`, { headers: auth(token) }));
  const post = <T>(url: string, body: unknown, token?: string) =>
    firstValueFrom(http.post<T>(`/api${url}`, body, { headers: auth(token) }));
  const erro = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (e: HttpErrorResponse) => ({ status: e.status, message: e.error?.message as string }),
    );
  const entrar = async (username: string, password: string) =>
    (await post<LoginResponse>('/auth/login', { username, password })).token;

  beforeEach(() => {
    localStorage.clear();
    restaurarDemo();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([demoApiInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  it('autentica e aplica as permissões de cada perfil', async () => {
    expect(await erro(entrar('admin', 'errada'))).toEqual({
      status: 401,
      message: 'Usuário ou senha inválidos',
    });
    expect((await erro(get('/dashboard')))?.status).toBe(401);

    const operador = await entrar('operador', 'operador123');
    expect(await get<{ perfil: string }>('/auth/me', operador)).toMatchObject({ perfil: 'OPERADOR' });
    expect(await erro(get('/funcionarios', operador))).toEqual({
      status: 403,
      message: 'Seu perfil não tem acesso a este recurso',
    });

    const admin = await entrar('admin', 'admin123');
    expect(await get<unknown[]>('/funcionarios', admin)).toHaveLength(10);
  });

  it('registra entrada e saída no caixa aberto, com o valor da tabela', async () => {
    const token = await entrar('operador', 'operador123');
    const modelos = await get<{ id: number; nome: string }[]>('/modelos', token);
    const onix = modelos.find((m) => m.nome === 'Onix')!;
    const antes = await get<Caixa>('/caixas/atual', token);

    const entrada = await post<Movimentacao>(
      '/movimentacoes/entrada',
      { placa: 'abc-1234', modeloId: onix.id },
      token,
    );
    expect(entrada).toMatchObject({ placa: 'ABC1234', noPatio: true, regime: 'Até 15 min', valor: 8 });
    expect(
      await erro(post('/movimentacoes/entrada', { placa: 'ABC1234', modeloId: onix.id }, token)),
    ).toEqual({ status: 409, message: 'O veículo ABC1234 já está no pátio' });

    const saida = await post<Movimentacao>(
      `/movimentacoes/${entrada.id}/saida`,
      { formaPagamento: 'DINHEIRO' },
      token,
    );
    expect(saida).toMatchObject({
      noPatio: false,
      valor: 8,
      formaPagamento: 'DINHEIRO',
      finalizadaPor: 'Carlos Lima',
    });

    const depois = await get<Caixa>('/caixas/atual', token);
    expect(depois.saidas).toBe(antes.saidas + 1);
    expect(depois.dinheiroEmGaveta).toBe(antes.dinheiroEmGaveta + 8);
  });

  it('exige o caixa aberto para registrar saídas', async () => {
    const token = await entrar('operador', 'operador123');
    const patio = await get<Pagina<Movimentacao>>('/movimentacoes?situacao=PATIO', token);
    await post('/caixas/fechar', null, token);

    expect(
      await erro(post(`/movimentacoes/${patio.itens[0].id}/saida`, { formaPagamento: 'PIX' }, token)),
    ).toEqual({ status: 409, message: 'Abra o caixa antes de registrar saídas' });
    expect((await get<Dashboard>('/dashboard', token)).caixa).toBeNull();
  });

  it('valida os campos como o backend e restaura os dados da demonstração', async () => {
    const token = await entrar('admin', 'admin123');
    const resposta = await firstValueFrom(
      http.post('/api/movimentacoes/entrada', {}, { headers: auth(token) }),
    ).catch((e: HttpErrorResponse) => e.error);
    expect(resposta.campos).toEqual({ placa: 'Informe a placa', modeloId: 'Selecione o modelo' });

    await post('/marcas', { nome: 'Nova Marca' }, token);
    expect(await get<unknown[]>('/marcas', token)).toHaveLength(11);
    await post('/demo/reset', null);
    expect(await get<unknown[]>('/marcas', token)).toHaveLength(10);
  });
});

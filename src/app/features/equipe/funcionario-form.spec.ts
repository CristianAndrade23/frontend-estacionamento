import { TestBed } from '@angular/core/testing';
import { Funcao, Funcionario, FuncionarioRequest } from '../../core/models';
import { FuncionarioForm } from './funcionario-form';

const funcoes: Funcao[] = [{ id: 7, nome: 'Manobrista', funcionarios: 1 }];
const existente: Funcionario = {
  id: 1,
  nome: 'Rafael Souza',
  cpf: '52998224725',
  nascimento: '1990-01-01',
  admissao: '2020-01-01',
  funcao: { id: 7, nome: 'Manobrista' },
};

describe('FuncionarioForm', () => {
  async function setup() {
    const fixture = TestBed.createComponent(FuncionarioForm);
    fixture.componentRef.setInput('funcoes', funcoes);
    fixture.componentRef.setInput('funcionarios', [existente]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const emitted: FuncionarioRequest[] = [];
    fixture.componentInstance.enviado.subscribe((r) => emitted.push(r));

    const campo = <T extends HTMLInputElement | HTMLSelectElement>(id: string) =>
      el.querySelector<T>(`#${id}`)!;
    const digitar = (id: string, valor: string) => {
      const input = campo(id);
      input.value = valor;
      // Como o navegador: `input` sempre, e `change` também nos selects.
      input.dispatchEvent(new Event('input'));
      if (input instanceof HTMLSelectElement) input.dispatchEvent(new Event('change'));
    };
    const preencher = async (dados: Record<string, string>) => {
      for (const [id, valor] of Object.entries(dados)) digitar(id, valor);
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    };
    const erros = () => [...el.querySelectorAll('.field__error')].map((e) => e.textContent?.trim());
    return { campo, preencher, erros, emitted };
  }

  const validos = {
    'func-nome': 'Juliana Martins',
    'func-cpf': '11144477735',
    'func-funcao': '7',
    'func-nascimento': '1995-04-12',
    'func-admissao': '2022-03-01',
  };

  it('mascara o CPF e envia só os dígitos', async () => {
    const { campo, preencher, emitted, erros } = await setup();
    await preencher(validos);
    expect(campo('func-cpf').value).toBe('111.444.777-35');
    expect(erros()).toEqual([]);
    expect(emitted).toEqual([
      {
        nome: 'Juliana Martins',
        cpf: '11144477735',
        funcaoId: 7,
        nascimento: '1995-04-12',
        admissao: '2022-03-01',
      },
    ]);
  });

  it('recusa CPF inválido e CPF de outro funcionário', async () => {
    const { preencher, emitted, erros } = await setup();
    await preencher({ ...validos, 'func-cpf': '11144477700' });
    expect(erros()).toContain('CPF inválido');

    await preencher({ ...validos, 'func-cpf': '529.982.247-25' });
    expect(erros()).toContain('Já existe um funcionário com este CPF');
    expect(emitted).toEqual([]);
  });

  it('exige 16 anos completos na admissão', async () => {
    const { preencher, emitted, erros } = await setup();
    await preencher({ ...validos, 'func-nascimento': '2010-05-01', 'func-admissao': '2026-04-30' });
    expect(erros()).toContain('Precisa ter pelo menos 16 anos na admissão');
    expect(emitted).toEqual([]);
  });
});

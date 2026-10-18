import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/api/api-error';
import { SessionService } from '../../core/auth/session.service';
import { appSettings } from '../../core/config';
import { Field } from '../../shared/field';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField, Field, Icon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export default class Login {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** `?expirada=1`: o token venceu ou foi recusado pela API. */
  readonly expirada = input<string>();

  protected readonly demo = appSettings.demoCredentials;
  protected readonly erro = signal<string | null>(null);

  private readonly model = signal({ username: '', password: '' });
  protected readonly loginForm = form(
    this.model,
    (p) => {
      required(p.username, { message: 'Informe o usuário' });
      required(p.password, { message: 'Informe a senha' });
    },
    { submission: { action: () => this.entrar() } },
  );

  protected preencher(perfil: 'admin' | 'operador') {
    this.model.set({ ...this.demo[perfil] });
    this.erro.set(null);
  }

  private async entrar() {
    this.erro.set(null);
    const { username, password } = this.model();
    try {
      await firstValueFrom(this.session.login(username.trim(), password));
    } catch (e) {
      this.erro.set(apiErrorMessage(e, 'Não foi possível entrar.'));
      return undefined;
    }
    await this.router.navigate(['/painel']);
    return undefined;
  }
}

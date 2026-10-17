import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { appSettings } from '../config';
import { LoginResponse, Usuario } from '../models';

const STORAGE_KEY = 'estaciona:sessao';

interface Sessao {
  token: string;
  expiraEm: string;
  usuario: Usuario;
}

function lerSessao(): Sessao | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const sessao = raw ? (JSON.parse(raw) as Sessao) : null;
    // Token vencido não chega a ser usado: o usuário volta direto para o login.
    return sessao && new Date(sessao.expiraEm).getTime() > Date.now() ? sessao : null;
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null) {
  try {
    if (sessao) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessao));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sem storage: a sessão fica só em memória */
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessao = signal<Sessao | null>(lerSessao());

  readonly token = computed(() => this.sessao()?.token ?? null);
  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly isLoggedIn = computed(() => this.sessao() !== null);
  readonly isAdmin = computed(() => this.usuario()?.perfil === 'ADMIN');

  login(username: string, password: string): Observable<Usuario> {
    return this.http.post<LoginResponse>(`${appSettings.apiUrl}/auth/login`, { username, password }).pipe(
      tap(({ token, expiraEm, usuario }) => this.definir({ token, expiraEm, usuario })),
      map(({ usuario }) => usuario),
    );
  }

  /** Encerra a sessão. `expirada` mostra o aviso na tela de login. */
  logout(expirada = false): void {
    this.definir(null);
    this.router.navigate(['/login'], expirada ? { queryParams: { expirada: 1 } } : {});
  }

  private definir(sessao: Sessao | null) {
    this.sessao.set(sessao);
    gravarSessao(sessao);
  }
}

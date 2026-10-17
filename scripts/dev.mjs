// `npm run dev`: sobe a API Spring Boot (porta 8080) e o `ng serve` (porta 4200) no mesmo terminal.
// O Angular encaminha /api para a API (proxy.conf.json). Ctrl+C encerra os dois.
import { spawn } from 'node:child_process';

const windows = process.platform === 'win32';
const processos = [
  { nome: 'api', cor: 36, comando: 'node', args: ['scripts/mvnw.mjs', '-q', 'spring-boot:run'] },
  { nome: 'web', cor: 35, comando: 'npx', args: ['ng', 'serve'] },
].map(({ nome, cor, comando, args }) => {
  const child = spawn(comando, args, { shell: windows, env: process.env });
  const prefixo = `\x1b[${cor}m[${nome}]\x1b[0m `;
  const repassar = (stream, destino) => {
    let resto = '';
    stream.on('data', (chunk) => {
      const linhas = (resto + chunk).split(/\r?\n/);
      resto = linhas.pop() ?? '';
      for (const linha of linhas) destino.write(prefixo + linha + '\n');
    });
  };
  repassar(child.stdout, process.stdout);
  repassar(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefixo}encerrado (código ${code})`);
    encerrar(code ?? 1);
  });
  return child;
});

let encerrando = false;
function encerrar(code) {
  if (encerrando) return;
  encerrando = true;
  for (const child of processos) {
    if (child.exitCode !== null) continue;
    // No Windows, matar só o shell deixa o Java e o Node órfãos: encerra a árvore inteira.
    if (windows) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    else child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => encerrar(0));
process.on('SIGTERM', () => encerrar(0));

console.log('API em http://localhost:8080 (Swagger: /swagger-ui.html) · Painel em http://localhost:4200');

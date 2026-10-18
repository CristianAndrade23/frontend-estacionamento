// Executa o Maven Wrapper do backend repassando os argumentos (ex.: `node scripts/mvnw.mjs test`).
// Usa mvnw.cmd no Windows e ./mvnw nos demais sistemas, sempre com backend/ como diretório.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = fileURLToPath(new URL('../backend/', import.meta.url));
const args = process.argv.slice(2);

// No Windows o .cmd precisa de shell; o caminho é absoluto porque o cmd pode estar configurado
// para não procurar executáveis no diretório atual (NoDefaultCurrentDirectoryInExePath).
const child =
  process.platform === 'win32'
    ? spawn(`"${join(backend, 'mvnw.cmd')}" ${args.join(' ')}`, { cwd: backend, stdio: 'inherit', shell: true })
    : spawn(join(backend, 'mvnw'), args, { cwd: backend, stdio: 'inherit' });

child.on('exit', (code) => process.exit(code ?? 1));

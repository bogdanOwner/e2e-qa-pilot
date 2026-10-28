import { execFileSync, spawn } from 'node:child_process';

function freePort() {
  const script = `
    const net = require('node:net');
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => process.stdout.write(String(port)));
    });
  `;
  return execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }).trim();
}

const port = process.env.PORT || freePort();
const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

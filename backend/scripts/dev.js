const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const port = Number(process.env.PORT || 5000);
const backendDirectory = path.join(__dirname, '..');

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exitCode = 1;
} else {
  startDevelopmentServer().catch((error) => {
    console.error(`Could not start the backend: ${error.message}`);
    process.exitCode = 1;
  });
}

async function isHealthyApi() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: controller.signal });
    if (!response.ok) return false;
    const payload = await response.json();
    return payload.success === true && payload.data?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function isPortInUse() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', (error) => resolve(error.code !== 'ECONNREFUSED'));
  });
}

async function startDevelopmentServer() {
  if (await isHealthyApi()) {
    console.log(`Portal API is already healthy on port ${port}; reusing the existing server.`);
    return;
  }
  if (await isPortInUse()) {
    console.error(`Port ${port} is already in use, but it did not respond as this portal's healthy API. The process was left untouched; identify it or choose another PORT.`);
    process.exitCode = 1;
    return;
  }

  const child = spawn(process.execPath, ['--watch', 'server.js'], {
    cwd: backendDirectory,
    stdio: 'inherit'
  });

  const forwardSignal = (signal) => {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  };
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));

  child.once('error', (error) => {
    console.error(`Could not start the backend: ${error.message}`);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}
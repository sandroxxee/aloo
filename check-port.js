import net from 'net';
import { execSync } from 'child_process';
import os from 'os';

const PORTS_TO_CHECK = [3000, 3001, 3002, 5173, 8080];
const isWindows = os.platform() === 'win32';

console.log('\n==================================================');
console.log('🔍 Diagnóstico e Verificador de Portas Ocupadas');
console.log('==================================================\n');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is occupied
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(false)); // Port is free
    });

    server.listen(port, '0.0.0.0');
  });
}

function getPidOnWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          return pid;
        }
      }
    }
  } catch (_e) {
    // Command failed or no process found
  }
  return null;
}

function getPidOnUnix(port) {
  try {
    const output = execSync(`lsof -t -i:${port}`).toString().trim();
    if (output) {
      return output.split('\n')[0];
    }
  } catch (_e) {
    // Command failed or no process found
  }
  return null;
}

async function runDiagnostics() {
  let foundOccupied = false;

  for (const port of PORTS_TO_CHECK) {
    const isOccupied = await checkPort(port);
    if (isOccupied) {
      foundOccupied = true;
      console.log(`⚠️  PORTA ${port}: OCUPADA por outro processo.`);

      const pid = isWindows ? getPidOnWindows(port) : getPidOnUnix(port);

      if (pid) {
        console.log(`   └─ PID do Processo: ${pid}`);
        console.log(`   └─ Comando para liberar (Windows):  taskkill /F /PID ${pid}`);
        console.log(`   └─ Comando para liberar (Mac/Linux): kill -9 ${pid}\n`);
      } else {
        console.log(`   └─ Comando geral para liberar (Windows):  netstat -ano | findstr :${port}`);
        console.log(`   └─ Comando geral para liberar (Mac/Linux): npx kill-port ${port}\n`);
      }
    } else {
      console.log(`✅ PORTA ${port}: LIVRE para uso.`);
    }
  }

  console.log('\n--------------------------------------------------');
  if (foundOccupied) {
    console.log('💡 DICA: Execute o comando de encerramento acima ou use o script de inicialização automática:');
    console.log('   Windows: start-app.bat');
    console.log('   Mac/Linux: ./start-app.sh');
  } else {
    console.log('🎉 Todas as portas principais estão livres! Você pode rodar `npm run dev` normalmente.');
  }
  console.log('==================================================\n');
}

runDiagnostics();

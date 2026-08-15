const { app, BrowserWindow, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
const TARGET_PORT = process.env.PORT || 3000;

function checkServerReady(port, callback) {
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    http.get(`http://localhost:${port}/api/health`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        clearInterval(interval);
        callback(true);
      }
    }).on('error', () => {
      if (attempts > 30) {
        clearInterval(interval);
        callback(false);
      }
    });
  }, 500);
}

function startBackendServer() {
  const isDev = !app.isPackaged;
  const serverScript = isDev
    ? path.join(__dirname, 'server.ts')
    : path.join(__dirname, 'dist', 'server.cjs');

  if (isDev) {
    // Development mode: run with tsx
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    serverProcess = spawn(npxCmd, ['tsx', 'server.ts'], {
      cwd: __dirname,
      env: { ...process.env, PORT: TARGET_PORT, NODE_ENV: 'development' },
      shell: true
    });
  } else {
    // Production mode: run node dist/server.cjs
    serverProcess = spawn('node', [serverScript], {
      cwd: __dirname,
      env: { ...process.env, PORT: TARGET_PORT, NODE_ENV: 'production' }
    });
  }

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Servidor]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Servidor Erro]: ${data}`);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Asset Intelligence',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.setMenu(null);

  // External links open in real browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  checkServerReady(TARGET_PORT, (ready) => {
    if (ready) {
      mainWindow.loadURL(`http://localhost:${TARGET_PORT}`);
    } else {
      dialog.showErrorBox(
        'Erro de Conexão',
        'Não foi possível conectar ao servidor backend. Tente reiniciar o aplicativo.'
      );
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackendServer();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

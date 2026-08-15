import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Laptop,
  X,
  ShieldCheck,
  Cpu,
  Zap,
  HardDrive
} from 'lucide-react';

interface WindowsInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsInstallerModal: React.FC<WindowsInstallerModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadBat = () => {
    const batContent = `@echo off
echo =======================================================
echo    ASSET INTELLIGENCE - GERADOR DE INSTALADOR WINDOWS
echo =======================================================
echo.
echo [1/3] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Compilando frontend Vite e servidor Node.js...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha na compilacao do aplicativo.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Gerando Instalador Windows EXE (Electron Builder)...
call npx electron-builder --win nsis portable
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao gerar instalador Electron para Windows.
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================================
echo    INSTALADOR CRIADO COM SUCESSO!
echo    Verifique a pasta "release\\" no seu computador:
echo    - Asset Intelligence Setup 1.0.0.exe (Instalador NSIS)
echo    - Asset Intelligence 1.0.0.exe (Versao Portavel)
echo =======================================================
echo.
pause
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gerar-instalador-windows.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setPwaInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Instalador Windows & App Desktop</h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  EXE / NSIS / PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transforme o Asset Intelligence em um aplicativo nativo para Windows (.exe)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* Option 1: Quick Install via Browser PWA / Desktop App */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className=" text-blue-950 text-base">
                    Opção 1: Instalação Rápida no Windows (1 Clique)
                  </h4>
                  <p className="text-xs text-blue-800">
                    Instala o programa diretamente como aplicativo de trabalho da barra de tarefas do Windows.
                  </p>
                </div>
              </div>

              {pwaInstalled ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Instalado no PC
                </span>
              ) : deferredPrompt ? (
                <button
                  onClick={handleInstallPWA}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 animate-pulse"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar no Windows Agora</span>
                </button>
              ) : (
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold">
                    Disponível no menu do navegador (ícone 🖥️ na barra de endereço)
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600">
              💡 No Windows (Edge / Chrome / Brave), você pode clicar no ícone de aplicativo na barra de endereços do navegador para criar o atalho da área de trabalho e barra de tarefas.
            </p>
          </div>

          {/* Option 2: Full Native Electron Installer (.exe) */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className=" text-slate-900 text-base">
                    Opção 2: Gerar Instalador Executável Nativo (.EXE)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Gera os arquivos <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono font-bold">Asset Intelligence Setup 1.0.0.exe</code> e portátil.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDownloadBat}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Baixar Script .BAT</span>
              </button>
            </div>

            {/* Step by step guide */}
            <div className="space-y-3 pt-1">
              <p className="font-bold text-xs text-slate-800">
                Passos para compilar o Instalador no seu Computador Windows:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
                    <span>Baixar o Código</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Exporte o código-fonte (ZIP ou GitHub) das configurações do sistema.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                    <span>Executar o Script .BAT</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Abra a pasta no Windows e dê dois cliques no arquivo <code className="bg-slate-200 text-slate-800 px-1 rounded font-mono">gerar-instalador-windows.bat</code>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">3</span>
                    <span>Instalador Criado</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    O arquivo <code className="bg-slate-200 text-slate-800 px-1 rounded font-mono">.exe</code> estará pronto na pasta <code className="bg-slate-200 text-slate-800 px-1 rounded font-mono">release/</code>.
                  </p>
                </div>
              </div>

              {/* Terminal Commands Card */}
              <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-sm text-slate-400 border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Comandos Manuais de Prompt (Cmd / PowerShell)</span>
                  </div>
                  <span>Electron Builder v26</span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-bold">npm run dist:win</span>
                  <button
                    onClick={() => copyToClipboard('npm run dist:win', 'dist:win')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'dist:win' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'dist:win' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-amber-300 font-bold">npm run desktop</span>
                  <button
                    onClick={() => copyToClipboard('npm run desktop', 'desktop')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd === 'desktop' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'desktop' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications & Features of the Desktop Windows App */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Instalador NSIS</div>
                <p className="text-sm text-slate-500">Com atalhos no Menu Iniciar e Painel de Controle</p>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Versão Portátil</div>
                <p className="text-sm text-slate-500">Executa direto de pendrives sem instalar</p>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Desempenho Nativo</div>
                <p className="text-sm text-slate-500">Suporte a segundo plano e notificações nativas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Asset Intelligence v1.0.0 (Windows Electron)</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Gerar Arquivo .BAT</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

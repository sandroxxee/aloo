import React, { useState, useEffect } from 'react';
import { 
  Database
} from 'lucide-react';
import { 
  getAutoBackupsHistory, 
  decodeAutoBackupSnapshot, 
  restoreBackup, 
  AutoBackupSnapshot,
  saveBackup
} from '../utils/backup';
import { Lead } from '../types';
import { useToast } from './Toast';

interface AutoBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLeadsCount: number;
  onRestoreLeads: (leads: Lead[]) => void;
  onAddLog?: (log: any) => void;
}

export const AutoBackupModal: React.FC<AutoBackupModalProps> = ({
  isOpen,
  onClose,
  currentLeadsCount,
  onRestoreLeads,
  onAddLog
}) => {
  const { success, error: toastError } = useToast();
  const [snapshots, setSnapshots] = useState<AutoBackupSnapshot[]>([]);
  const [primaryBackupLeadsCount, setPrimaryBackupLeadsCount] = useState<number | null>(null);
  const [restoredMsg, setRestoredMsg] = useState<string | null>(null);
  const [importedFileContent, setImportedFileContent] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshBackups();
    }
  }, [isOpen, currentLeadsCount]);

  const refreshBackups = () => {
    const history = getAutoBackupsHistory();
    setSnapshots(history);

    const primaryBackup = restoreBackup();
    if (primaryBackup && primaryBackup.length > 0) {
      setPrimaryBackupLeadsCount(primaryBackup.length);
    } else {
      setPrimaryBackupLeadsCount(null);
    }
  };

  if (!isOpen) return null;

  const handleRestoreSnapshot = (snapshot: AutoBackupSnapshot) => {
    try {
      const decodedLeads = decodeAutoBackupSnapshot(snapshot);
      if (decodedLeads && decodedLeads.length > 0) {
        onRestoreLeads(decodedLeads);
        success(`🔄 Checkpoint restaurado! ${decodedLeads.length} contatos recuperados.`);
        if (onAddLog) {
          onAddLog({
            id: `log_restore_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'success',
            message: `🔄 Backup restaurado: ${decodedLeads.length} leads carregados do checkpoint "${snapshot.timestamp}".`
          });
        }
      } else {
        toastError('❌ Não foi possível decodificar os contatos deste checkpoint.');
      }
    } catch (e) {
      console.error('Erro ao restaurar snapshot:', e);
      toastError('❌ Erro ao processar restauração.');
    }
  };

  const handleRestorePrimaryBackup = () => {
    const primaryBackup = restoreBackup();
    if (primaryBackup && primaryBackup.length > 0) {
      onRestoreLeads(primaryBackup);
      success(`🔄 Backup Geral restaurado! ${primaryBackup.length} contatos recuperados.`);
      if (onAddLog) {
        onAddLog({
          id: `log_restore_primary_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `🔄 Backup Geral restaurado com ${primaryBackup.length} leads.`
        });
      }
    } else {
      toastError('❌ Nenhum backup geral encontrado no armazenamento do navegador.');
    }
  };

  const handleDownloadSnapshot = (snapshot: AutoBackupSnapshot) => {
    try {
      const decodedLeads = decodeAutoBackupSnapshot(snapshot);
      const jsonStr = JSON.stringify(decodedLeads, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_checkpoint_${snapshot.count}_leads_${snapshot.timestamp.replace(/[/ :]/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao baixar snapshot:', e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          onRestoreLeads(parsed);
          saveBackup(parsed);
          success(`📥 Arquivo JSON importado! ${parsed.length} contatos restaurados.`);
          refreshBackups();
        } else if (parsed && typeof parsed === 'object') {
          // Check if nested in leads array
          const arr = parsed.leads || parsed.data || [];
          if (Array.isArray(arr) && arr.length > 0) {
            onRestoreLeads(arr);
            saveBackup(arr);
            success(`📥 Arquivo JSON importado! ${arr.length} contatos restaurados.`);
            refreshBackups();
          } else {
            toastError('❌ Formato JSON não reconhecido. Certifique-se de ser um array de leads.');
          }
        }
      } catch (err) {
        toastError('❌ Erro ao ler arquivo JSON. Formato inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold ">Memória de Backup</h2>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-full">
                AUTO (100/100)
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-medium">
              Recuperação de contatos minerados em lote via armazenamento local.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-100">

          {/* Feedback notification banner */}
          {restoredMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <span>{restoredMsg}</span>
            </div>
          )}

          {importStatus && (
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <span>{importStatus}</span>
            </div>
          )}

          {/* Status Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Total Ativo na Tela
              </div>
              <div className="text-2xl font-display font-medium text-indigo-600 dark:text-indigo-400">
                {currentLeadsCount.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">leads</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Contatos atualmente visíveis na sua Base de Leads.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-1">
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <span>Último Backup Geral</span>
              </div>
              <div className="text-2xl font-display font-medium text-slate-900 dark:text-white">
                {primaryBackupLeadsCount !== null ? `${primaryBackupLeadsCount.toLocaleString('pt-BR')} leads` : 'Sem registro'}
              </div>
              {primaryBackupLeadsCount !== null ? (
                <button
                  onClick={handleRestorePrimaryBackup}
                  className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>Restaurar Backup Geral ({primaryBackupLeadsCount})</span>
                </button>
              ) : (
                <p className="text-sm text-slate-500">Nenhum backup geral pendente.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold  text-slate-700 dark:text-slate-200">
                  Checkpoints Automáticos
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 ">
                {snapshots.length} Arquivos
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2">
                <p className="text-sm font-bold  text-slate-700 dark:text-slate-300">
                  Nenhum checkpoint gerado.
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Marcos de 100 em 100 contatos aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {snapshots.map((sb) => (
                  <div 
                    key={sb.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {sb.count}
                      </div>
                      <div>
                        <div className="text-sm font-bold  text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{sb.count} Leads</span>
                          <span className="text-xs font-medium text-slate-400">({sb.timestamp})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestoreSnapshot(sb)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        Restaurar
                      </button>

                      <button
                        onClick={() => handleDownloadSnapshot(sb)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 transition-all cursor-pointer"
                      >
                        Baixar JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import External JSON Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold  text-slate-800 dark:text-slate-200">
                Importar Backup Externo (.JSON)
              </h3>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Restaure contatos de um arquivo de backup baixado anteriormente.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="modal-file-upload-input"
              />
              <label
                htmlFor="modal-file-upload-input"
                className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs  rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
              >
                <span>Selecionar Arquivo .JSON</span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            🔒 Dados protegidos localmente no navegador via LZ-String.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

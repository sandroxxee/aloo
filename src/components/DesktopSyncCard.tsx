import React, { useState, useEffect } from 'react';
import { Laptop, Download, ShieldCheck, History, Database, HardDrive } from 'lucide-react';
import { getAutoBackupsHistory, decodeAutoBackupSnapshot, AutoBackupSnapshot } from '../utils/backup';

interface DesktopSyncCardProps {
  leadsCount: number;
  onExport: () => void;
  onFileLoaded: (leads: any[], fileName: string) => void;
}

export const DesktopSyncCard: React.FC<DesktopSyncCardProps> = ({
  leadsCount,
  onExport,
  onFileLoaded,
}) => {
  const [autoBackups, setAutoBackups] = useState<AutoBackupSnapshot[]>([]);

  useEffect(() => {
    setAutoBackups(getAutoBackupsHistory());
    const interval = setInterval(() => {
      setAutoBackups(getAutoBackupsHistory());
    }, 5000);
    return () => clearInterval(interval);
  }, [leadsCount]);

  const handleDownloadSnapshot = (snapshot: AutoBackupSnapshot) => {
    try {
      const leads = decodeAutoBackupSnapshot(snapshot);
      const jsonStr = JSON.stringify(leads, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_checkpoint_${snapshot.count}_leads_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao baixar snapshot:', e);
    }
  };

  const nextMilestone = Math.floor(leadsCount / 100) * 100 + 100;
  const progressToNext = leadsCount % 100;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Memória de Leads & Backup Automático (100 em 100)</h3>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Proteção Ativa
        </span>
      </div>

      <p className="text-xs text-slate-500">
        O sistema grava automaticamente um checkpoint de segurança a cada 100 contatos minerados. Total atual: <span className="font-bold text-slate-800">{leadsCount} leads</span>. Próximo checkpoint em {nextMilestone - leadsCount} leads.
      </p>

      {/* Progress bar to next 100 */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Progresso para checkpoint ({nextMilestone} leads)</span>
          <span>{progressToNext}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(progressToNext, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={onExport}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Base Completa (JSON)</span>
        </button>
      </div>

      {/* Auto-backup history list */}
      {autoBackups.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Checkpoints Automáticos Salvos (Baixar a qualquer momento):</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {autoBackups.map((sb) => (
              <div 
                key={sb.id}
                className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{sb.count} Leads</span>
                  <span className="text-slate-400 text-sm ml-2">({sb.timestamp})</span>
                </div>
                <button
                  onClick={() => handleDownloadSnapshot(sb)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 font-bold text-sm rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors"
                  title="Baixar arquivo de backup deste checkpoint"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar Backup</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


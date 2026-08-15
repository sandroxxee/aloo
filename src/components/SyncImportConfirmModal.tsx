import React from 'react';
import { Lead } from '../types';

interface SyncImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadsCount: number;
  fileName: string;
  onConfirm: (mode: 'merge' | 'replace') => void;
}

export const SyncImportConfirmModal: React.FC<SyncImportConfirmModalProps> = ({
  isOpen,
  onClose,
  leadsCount,
  fileName,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="glass-panel shadow-elegant w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm  text-slate-900">Confirmar Importação de Backup</h3>
        <p className="text-xs text-slate-600">
          Arquivo <strong className="text-slate-900">{fileName}</strong> contém <strong>{leadsCount}</strong> contatos.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm('merge')}
            className="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl"
          >
            Mesclar Leads
          </button>
        </div>
      </div>
    </div>
  );
};

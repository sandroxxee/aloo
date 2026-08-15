import React, { useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Lead } from '../types';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLeads: (leads: Lead[], mode: 'merge' | 'replace' | 'append') => void;
  currentLeadsCount: number;
}

export const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImportLeads,
  currentLeadsCount,
}) => {
  const [fileText, setFileText] = useState('');
  const [mode, setMode] = useState<'merge' | 'replace' | 'append'>('merge');

  if (!isOpen) return null;

  const handleImport = () => {
    if (!fileText.trim()) return;
    try {
      const parsed = JSON.parse(fileText);
      const leadsArray = Array.isArray(parsed) ? parsed : parsed.leads || [];
      if (leadsArray.length > 0) {
        onImportLeads(leadsArray, mode);
        onClose();
      } else {
        alert('Nenhum lead encontrado no formato JSON.');
      }
    } catch (e) {
      alert('Formato JSON inválido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="glass-panel shadow-elegant w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm  text-slate-900">Importar Leads (JSON / Backup)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1">
            ✕
          </button>
        </div>

        <textarea
          value={fileText}
          onChange={(e) => setFileText(e.target.value)}
          placeholder="Cole aqui o conteúdo do seu arquivo JSON de backup de leads..."
          className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-600"
        />

        <div className="flex items-center justify-between">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="merge">Mesclar (Deduplicar por Telefone)</option>
            <option value="append">Adicionar ao Início</option>
            <option value="replace">Substituir Base Atual</option>
          </select>

          <button
            onClick={handleImport}
            disabled={!fileText.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs"
          >
            Importar Leads
          </button>
        </div>
      </div>
    </div>
  );
};

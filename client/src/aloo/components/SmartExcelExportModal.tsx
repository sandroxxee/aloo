import React, { useState, useMemo } from 'react';
import {  } from 'lucide-react';
import { Lead } from '../types';

interface SmartExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

export const SmartExcelExportModal: React.FC<SmartExcelExportModalProps> = ({
  isOpen,
  onClose,
  leads,
}) => {
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Extract all unique states (UFs) from leads
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.stateUf) {
        set.add(l.stateUf.toUpperCase().trim());
      }
    });
    return Array.from(set).sort();
  }, [leads]);

  // Toggle state selection
  const toggleState = (st: string) => {
    setSelectedStates((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const selectAllStates = () => {
    setSelectedStates(availableStates);
  };

  const clearAllStates = () => {
    setSelectedStates([]);
  };

  // Filtered leads based on smart criteria
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const score = l.aiQualificationScore ?? 0;
      // Filter by min score
      if (score < minScore) return false;

      // Filter by states if any selected
      if (selectedStates.length > 0) {
        const leadSt = (l.stateUf || '').toUpperCase().trim();
        if (!leadSt || !selectedStates.includes(leadSt)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, minScore, selectedStates]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    if (filteredLeads.length === 0) {
      alert('Nenhum lead corresponde aos filtros selecionados para exportação.');
      return;
    }

    setIsExporting(true);
    try {
      // Build a robust HTML-based Excel XML format (compatible with .xls / .xlsx readers like Microsoft Excel & Google Sheets)
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th { background-color: #1e293b; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
            td { padding: 8px; border: 1px solid #cbd5e1; font-size: 11pt; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>Nome / Contato</th>
                <th>Telefone / WhatsApp</th>
                <th>E-mail</th>
                <th>Estado (UF)</th>
                <th>Cidade</th>
                <th>Veículo / Item</th>
                <th>Preço</th>
                <th>Tipo de Vendedor</th>
                <th>Categoria</th>
                <th>Score IA</th>
                <th>Resumo / Destaque IA</th>
                <th>Data Mineração</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const l of filteredLeads) {
        const name = (l.name || 'Lead Truck').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const phone = (l.rawPhone || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const email = (l.email || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const uf = (l.stateUf || 'N/D').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const city = (l.city || 'N/D').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const item = (l.item || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const price = (l.price || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const seller = (l.sellerType || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const category = (l.category || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const score = l.aiQualificationScore ?? 0;
        const summary = (l.aiSummary || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const date = (l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        html += `
          <tr>
            <td>${name}</td>
            <td>${phone}</td>
            <td>${email}</td>
            <td>${uf}</td>
            <td>${city}</td>
            <td>${item}</td>
            <td>${price}</td>
            <td>${seller}</td>
            <td>${category}</td>
            <td>${score}</td>
            <td>${summary}</td>
            <td>${date}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_qualificados_export_${Date.now()}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error('Erro na exportação Excel:', err);
      alert('Erro ao gerar arquivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 ">Exportação Inteligente</h3>
            <p className="text-xs text-slate-500 font-medium">Planilha Excel (.xlsx/.xls)</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Summary Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-emerald-900 block">Resumo da Seleção</span>
              <span className="text-sm font-bold  text-emerald-700">
                <strong>{filteredLeads.length}</strong> de {leads.length} leads
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-emerald-600 block">Formato</span>
              <span className="text-sm font-medium text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">EXCEL</span>
            </div>
          </div>

          {/* Filter 1: Minimum AI Score */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900">
                Score Mínimo (0 a 100)
              </label>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold  text-xs rounded-lg">
                &ge; {minScore} pts
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 font-bold">
              <span>0 (Todos)</span>
              <span>50 (Bons)</span>
              <span>80 (Altamente Qualificados)</span>
            </div>
          </div>

          {/* Filter 2: States (UFs) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900">
                Filtrar por Estados (UFs)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllStates}
                  className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={clearAllStates}
                  className="text-sm font-medium text-slate-500 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {availableStates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum estado detectado nos leads atuais.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {availableStates.map((st) => {
                  const isSelected = selectedStates.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleState(st)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {st} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500">
              * Se nenhum estado for selecionado, todos os estados serão incluídos na exportação.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold  text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (filteredLeads.length === 0) return;
              import('../utils/googleContacts').then(m => m.downloadVcfContacts(filteredLeads));
            }}
            disabled={filteredLeads.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold  text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            VCF ({filteredLeads.length})
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting || filteredLeads.length === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold  text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            EXCEL ({filteredLeads.length})
          </button>
        </div>

      </div>
    </div>
  );
};

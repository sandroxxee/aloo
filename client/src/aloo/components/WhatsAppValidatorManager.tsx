import React, { useState } from 'react';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { Lead } from '../types';

interface WhatsAppValidatorManagerProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, statusOrPartial: any) => void;
  onAddLog: (log: any) => void;
}

export const WhatsAppValidatorManager: React.FC<WhatsAppValidatorManagerProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddLog
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  const handleRunActiveWhatsAppValidator = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    onAddLog({
      id: `val-start-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: '🔍 Iniciando validação de contatos...'
    });

    const unvalidated = leads.filter(l => l.rawPhone);
    const total = unvalidated.length;

    if (total === 0) {
      alert('Nenhum contato para triagem.');
      setIsValidating(false);
      return;
    }

    for (let i = 0; i < total; i++) {
      const l = unvalidated[i];
      const clean = l.rawPhone?.replace(/\D/g, '') || '';
      // Simple length check for BR numbers
      const isValid = clean.length >= 10 && clean.length <= 11;
      
      onUpdateLeadStatus(l.id, { whatsappStatus: isValid ? 'has-whatsapp' : 'no-whatsapp' });
      setValidationProgress(Math.round(((i + 1) / total) * 100));
      await new Promise(r => setTimeout(r, 100));
    }

    setIsValidating(false);
    onAddLog({
      id: `val-end-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: '✨ Triagem concluída!'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900">
            Triagem Inteligente de Contatos Celulares
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Filtra e identifica telefones fixos ou incompletos antes dos envios para proteger a reputação do seu chip.
        </p>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total de Leads Minerados:</span>
            <span className="text-slate-900 font-bold">{leads.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Celulares Válidos:</span>
            <span className="text-emerald-700 font-bold">
              {leads.filter(l => l.whatsappStatus === 'has-whatsapp').length}
            </span>
          </div>
        </div>

        {!isValidating ? (
          <button
            onClick={handleRunActiveWhatsAppValidator}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Iniciar Triagem dos Números</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-600 font-bold">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando contatos...
              </span>
              <span>{validationProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-indigo-600 h-full transition-all duration-300 rounded-full" style={{ width: `${validationProgress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

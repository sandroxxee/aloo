import React, { useState, useEffect } from 'react';
import { Key, Sparkles, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, ExternalLink, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const GoogleAiProConfigModal: React.FC<Props> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('truck_miner_google_ai_key') || '');
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('truck_miner_google_ai_key') || '';
      setApiKey(saved);
      setStatusMessage(null);
      setStatusType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      // Clear key
      localStorage.removeItem('truck_miner_google_ai_key');
      setStatusMessage('Chave própria removida. O sistema usará o servidor padrão.');
      setStatusType('success');
      if (onKeySaved) onKeySaved('');
      setTimeout(() => onClose(), 1500);
      return;
    }

    setIsValidating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('truck_miner_google_ai_key', apiKey.trim());
        setStatusMessage(data.message || '⚡ Chave do Google AI Studio Pro validada e ativada!');
        setStatusType('success');
        if (onKeySaved) onKeySaved(apiKey.trim());
        setTimeout(() => onClose(), 1800);
      } else {
        setStatusMessage(data.error || 'Falha ao validar a chave de API do Google Gemini.');
        setStatusType('error');
      }
    } catch (err: any) {
      setStatusMessage('Erro de conexão ao testar a chave.');
      setStatusType('error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base  text-slate-900 flex items-center gap-1.5">
                Google AI Studio Key
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  100% GRATUITO
                </span>
              </h3>
              <p className="text-xs text-slate-500">Conecte sua Chave Grátis de API do Google Gemini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Informative Callout */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-4 text-xs space-y-2 text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Recurso 100% Gratuito da Google AI (Sem Cartão de Crédito)</span>
          </div>
          <ul className="space-y-1 pl-4 list-disc text-slate-600 leading-relaxed text-sm">
            <li><strong>Plano Free Oficial Google AI Studio:</strong> Cota gratuita diária sem nenhum custo extra.</li>
            <li><strong>Grounding com Buscas Web Live:</strong> Acesso direto à tabela FIPE atualizada e pesquisas em tempo real.</li>
            <li><strong>Análise & Auditoria por IA:</strong> Dossiê executivo e precificação comercial de caminhões e autopeças.</li>
          </ul>
        </div>

        {/* Key Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Chave de API (Google AI Studio Key)</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 hover:underline font-semibold flex items-center gap-1"
              >
                Obter chave grátis no Google AI
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua AI Studio API Key (AIzaSy...)"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs"
              />
            </div>
            <p className="text-xs text-slate-400">
              Deixe em branco para continuar usando o servidor padrão integrado.
            </p>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusType === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 font-semibold'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando Chave Google...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar & Ativar Google AI Gratuito</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

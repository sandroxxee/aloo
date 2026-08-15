import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

interface WhatsAppCampaignRadarProps {
  sentCount: number;
  repliedCount: number;
  progressPercent: number;
  isRunning: boolean;
  onOpenTrackingModal?: () => void;
}

export const WhatsAppCampaignRadar: React.FC<WhatsAppCampaignRadarProps> = ({
  sentCount,
  repliedCount,
  progressPercent,
  isRunning,
  onOpenTrackingModal,
}) => {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-sm">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold tracking-[0.16em] text-slate-300">Radar de saúde da campanha</h3>
          </div>
          <h4 className="font-display text-xl font-medium text-slate-100">Painel de desempenho comercial</h4>
          <p className="max-w-md text-xs text-slate-400">
            Monitoramento em tempo real de entrega, taxa de conversão e triagem semântica via IA Gemini.
          </p>
        </div>

        <div className="flex items-center gap-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-center">
            <span className="mb-1 block text-xs font-bold text-slate-400">Entregues</span>
            <span className="font-display text-2xl font-medium text-slate-100">{sentCount}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <span className="mb-1 block text-xs font-bold text-slate-400">Respostas</span>
            <span className="font-display text-2xl font-medium text-emerald-400">{repliedCount}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <span className="mb-1 block text-xs font-bold text-slate-400">Taxa de retorno</span>
            <span className="font-display text-2xl font-medium text-slate-100">
              {sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2.5 md:w-52">
          {onOpenTrackingModal && (
            <button
              type="button"
              onClick={onOpenTrackingModal}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-white active:scale-95"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Acompanhamento</span>
            </button>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-200">
              <span>Saúde da campanha</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-[width] duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Proteção: {isRunning ? 'ATIVADA' : 'EM ESPERA'}
          </div>
        </div>
      </div>
    </div>
  );
};

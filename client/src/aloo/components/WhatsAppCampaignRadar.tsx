import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

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
  onOpenTrackingModal
}) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 border border-indigo-500/30 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Activity className="w-24 h-24 text-white" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-indigo-100 text-xs font-bold tracking-[0.2em]">Radar de Saúde da Campanha V3.2</h3>
          </div>
          <h4 className="text-white text-xl font-display font-medium">Dashboard de Performance Comercial</h4>
          <p className="text-indigo-300/70 text-xs max-w-md">
            Monitoramento em tempo real de entrega, taxa de conversão e triagem semântica via IA Gemini.
          </p>
        </div>

        <div className="flex items-center gap-8 bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-center">
            <span className="text-xs font-bold text-indigo-300 block mb-1">Entregues</span>
            <span className="text-2xl font-display font-medium text-white">{sentCount}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <span className="text-xs font-bold text-emerald-300 block mb-1">Respostas</span>
            <span className="text-2xl font-display font-medium text-emerald-400">{repliedCount}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <span className="text-xs font-bold text-amber-300 block mb-1">Taxa ROI %</span>
            <span className="text-2xl font-display font-medium text-amber-400">
              {sentCount > 0 ? ((repliedCount / sentCount) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full md:w-52">
          {onOpenTrackingModal && (
            <button
              type="button"
              onClick={onOpenTrackingModal}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Acompanhamento Real 💬</span>
            </button>
          )}

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>Saúde da Campanha</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Proteção: {isRunning ? 'ATIVADA' : 'EM ESPERA'}
          </div>
        </div>
      </div>
    </div>
  );
};

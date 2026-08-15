import React, { useState } from 'react';
import { Zap, Bot, ChevronRight } from 'lucide-react';
import { CADENCE_FUNNEL_STAGES } from '../utils/cadenceEngine';

interface WhatsAppCadenceManagerProps {
  onAddLog: (log: any) => void;
}

export const WhatsAppCadenceManager: React.FC<WhatsAppCadenceManagerProps> = ({ onAddLog }) => {
  // Using local state to force re-renders when mutating the global constant (not ideal but preserves existing logic)
  const [, setTick] = useState(0);

  const toggleAudioPTT = (step: number) => {
    const stage = CADENCE_FUNNEL_STAGES.find(s => s.step === step);
    if (stage) {
      stage.sendAsAudioPTT = !stage.sendAsAudioPTT;
      onAddLog({
        id: `cadence-update-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `🎯 Passo ${step} atualizado para ${stage.sendAsAudioPTT ? 'ÁUDIO PTT' : 'TEXTO'}.`
      });
      setTick(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-600/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Funil de Cadência Automática (3 Dias)
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">V3.1 Intelligence</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-2xl">
                O sistema de Asset Intelligence gerencia automaticamente o reengajamento dos seus ativos. 
                Se o cliente não responder, o sistema envia novas abordagens estrategicamente calculadas para maximizar a conversão.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {CADENCE_FUNNEL_STAGES.map((stage) => (
            <div key={stage.step} className={`relative flex flex-col p-6 rounded-[2rem] border-2 transition-all ${
              stage.step === 2 
                ? 'bg-amber-50/50 border-amber-500/30 shadow-xl shadow-amber-500/5' 
                : 'bg-white border-slate-100'
            }`}>
              {/* Step Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold shadow-sm ${
                    stage.step === 1 ? 'bg-indigo-600 text-white' :
                    stage.step === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {stage.step}
                  </div>
                  <span className="text-sm font-bold  text-slate-400">Mensagem {stage.step}</span>
                </div>
                <div className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 shadow-2xs">
                  T + {stage.delayHours}h
                </div>
              </div>

              {/* Title & Objective */}
              <div className="space-y-1.5 mb-5 flex-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{stage.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed italic">"{stage.objective}"</p>
              </div>

              {/* V3.1: IA Audio PTT Configuration */}
              <div className={`mt-auto p-4 rounded-2xl border ${
                stage.step === 2 ? 'bg-white border-amber-200' : 'bg-slate-50 border-slate-200'
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stage.step === 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">IA Áudio PTT</span>
                  </div>
                  {stage.step === 2 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded animate-pulse">Recomendado</span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 leading-tight">
                  Converter esta abordagem em áudio humanizado via ElevenLabs API para maior conexão emocional.
                </p>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stage.sendAsAudioPTT ? 'Ativado (Áudio)' : 'Desativado (Texto)'}</span>
                  <button
                    onClick={() => toggleAudioPTT(stage.step)}
                    className={`w-10 h-5 rounded-full transition-all relative shadow-inner ${stage.sendAsAudioPTT ? 'bg-emerald-600 shadow-emerald-700/20' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${stage.sendAsAudioPTT ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          <div className="z-10 space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white ">Inteligência de Reengajamento V3.1</h4>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              O sistema monitora respostas em tempo real. Se o lead interagir em qualquer ponto, a cadência é **interrompida imediatamente** e o lead é movido para "Em Atendimento" no seu Kanban para sua intervenção manual.
            </p>
          </div>
          <button className="z-10 px-6 py-3 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2">
            <span>Ativar Automação Global</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

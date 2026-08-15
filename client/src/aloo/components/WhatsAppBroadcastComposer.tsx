import React, { useState } from 'react';
import { MessageSquare, Wand2, Volume2, Zap, Loader2, Book, ChevronDown, Check } from 'lucide-react';
import { MessageTemplate } from '../types';

interface WhatsAppBroadcastComposerProps {
  broadcastMessageText: string;
  setBroadcastMessageText: (text: string) => void;
  messageType: string;
  setMessageType: (type: string) => void;
  mediaUrl: string;
  setMediaUrl: (url: string) => void;
  usePTTStep2: boolean;
  setUsePTTStep2: (val: boolean) => void;
  includeButtons: boolean;
  setIncludeButtons: (val: boolean) => void;
  onGenerateAiPitch: () => void;
  isAiNicheGenerating: boolean;
  activeGateway: string;
  pendingCount: number;
  onAddAllToQueue: () => void;
  templates?: MessageTemplate[];
}

export const WhatsAppBroadcastComposer: React.FC<WhatsAppBroadcastComposerProps> = ({
  broadcastMessageText,
  setBroadcastMessageText,
  messageType,
  setMessageType,
  mediaUrl,
  setMediaUrl,
  usePTTStep2,
  setUsePTTStep2,
  includeButtons,
  setIncludeButtons,
  onGenerateAiPitch,
  isAiNicheGenerating,
  activeGateway,
  pendingCount,
  onAddAllToQueue,
  templates = []
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSelectTemplate = (template: MessageTemplate) => {
    setBroadcastMessageText(template.text);
    if (template.mediaUrl) setMediaUrl(template.mediaUrl);
    if (template.sendAsAudioTTS !== undefined) setUsePTTStep2(template.sendAsAudioTTS);
    setShowTemplates(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Mensagem de Divulgação em Massa
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Book className="w-3.5 h-3.5" />
              <span>Meus Templates</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </button>

            {showTemplates && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selecione um Template</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {templates.length > 0 ? (
                    templates.map(template => (
                      <button 
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      >
                        <div className="text-xs font-bold text-slate-800 dark:text-white mb-0.5 truncate">{template.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{template.category}</div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-slate-400">Nenhum template salvo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={onGenerateAiPitch} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all">
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Biblioteca Copys IA</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={broadcastMessageText}
            onChange={(e) => setBroadcastMessageText(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
            placeholder="Digite a mensagem que será enviada para todos os leads..."
          />
          <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-100 shadow-2xs">
            {broadcastMessageText.length} caracteres
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">Tags Rápidas:</span>
            {['nome', 'item', 'preco', 'cidade'].map(tag => (
              <button key={tag} onClick={() => setBroadcastMessageText(broadcastMessageText + ` {${tag}}`)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 font-mono text-xs transition-colors">
                {`{${tag}}`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-sm text-slate-600 font-bold">
            <span>Canal:</span>
            <span className="text-indigo-600 ">{activeGateway === 'simulation' ? 'Simulador' : activeGateway === 'official' ? 'Oficial Meta' : 'Evolution API'}</span>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-4 space-y-4">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">🎬 Formato de Mensagem & Mídia</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['text', 'image', 'video', 'audio'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    messageType === type ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{type === 'text' ? '📝' : type === 'image' ? '🖼️' : type === 'video' ? '🎥' : '🎙️'}</span>
                  <span className="capitalize">{type === 'text' ? 'Texto' : type === 'image' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Áudio'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-600" /> ENVIAR COMO ÁUDIO (PTT)
                </label>
                <button onClick={() => setUsePTTStep2(!usePTTStep2)} className={`w-10 h-5 rounded-full relative transition-colors ${usePTTStep2 ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${usePTTStep2 ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-tight">Converte texto em áudio via <strong>ElevenLabs</strong>.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> INCLUIR BOTÕES
                </label>
                <button onClick={() => setIncludeButtons(!includeButtons)} className={`w-10 h-5 rounded-full relative transition-colors ${includeButtons ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeButtons ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-tight">Adiciona botões <strong>[Sim] [Já vendi]</strong> interativos.</p>
            </div>
          </div>

          {messageType !== 'text' && (
            <div className="space-y-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Insira a URL pública do arquivo..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
          <button
            onClick={onAddAllToQueue}
            disabled={pendingCount === 0 || isAiNicheGenerating}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
             {isAiNicheGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current animate-pulse text-amber-300" />}
            <span>Adicionar na Fila ({pendingCount} Leads)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

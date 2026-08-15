import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface WhatsAppLivePreviewProps {
  broadcastMessageText: string;
  messageType: string;
  mediaUrl: string;
  activeGateway: string;
}

export const WhatsAppLivePreview: React.FC<WhatsAppLivePreviewProps> = ({
  broadcastMessageText,
  messageType,
  mediaUrl,
  activeGateway
}) => {
  const [phoneTheme, setPhoneTheme] = useState<'light' | 'dark'>('light');
  const [mockName, setMockName] = useState('João da Silva');
  const [mockItem, setMockItem] = useState('Scania R440');
  const [mockPrice, setMockPrice] = useState('R$ 380.000');
  const [mockCity, setMockCity] = useState('Porto Alegre');

  const parseWhatsAppFormatting = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      .replace(/```([^`]+)```/g, '<code class="font-mono bg-black/10 px-1 rounded">$1</code>');
  };

  const getSpintaxResolvedPreview = (text: string) => {
    let resolved = text.replace(/\{([^{}]+)\}/g, (_, choiceStr) => {
      return choiceStr.split('|')[0];
    });
    
    return resolved
      .replace(/\{nome\}/gi, mockName)
      .replace(/\{item\}/gi, mockItem)
      .replace(/\{preco\}/gi, mockPrice)
      .replace(/\{cidade\}/gi, mockCity);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">
            Simulador Live Preview Zap
          </span>
        </div>
      </div>

      <div className="border-[12px] border-slate-900 rounded-[38px] shadow-2xl overflow-hidden bg-slate-900 max-w-[320px] mx-auto w-full relative flex flex-col aspect-[9/18]">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-indigo-900/40 rounded-full mr-2" />
          <span className="w-12 h-1 bg-slate-800 rounded-full" />
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-300 pt-7 ${phoneTheme === 'light' ? 'bg-[#efeae2]' : 'bg-[#0b141a]'}`}>
          <div className="absolute inset-0 opacity-4 pointer-events-none bg-[radial-gradient(#128c7e_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className={`p-3 flex items-center justify-between shadow-xs border-b relative z-10 ${phoneTheme === 'light' ? 'bg-[#f0f2f5] border-slate-200 text-slate-800' : 'bg-[#202c33] border-slate-800 text-slate-100'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">ZP</div>
              <div>
                <div className="text-xs font-bold leading-tight">zap API (Instância Ativa)</div>
                <div className="text-xs leading-tight text-emerald-500 font-bold">online</div>
              </div>
            </div>
            <button onClick={() => setPhoneTheme(prev => prev === 'light' ? 'dark' : 'light')} className="p-1.5 hover:bg-slate-500/10 rounded-lg">
              {phoneTheme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col justify-end relative z-10">
            <div className={`max-w-[85%] rounded-xl p-3 shadow-xs relative self-end transition-colors ${
              phoneTheme === 'light' ? 'bg-[#d9fdd3] text-slate-800 border border-emerald-100/50' : 'bg-[#005c4b] text-[#e9edef]'
            }`}>
              {messageType === 'image' && mediaUrl && (
                <div className="mb-2 rounded-xl overflow-hidden bg-black/10 aspect-video flex items-center justify-center">
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              {messageType === 'video' && mediaUrl && (
                <div className="mb-2 rounded-xl overflow-hidden bg-black/10 aspect-video flex items-center justify-center">
                  <video src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay />
                </div>
              )}
              {messageType === 'audio' && mediaUrl && (
                <div className="mb-2 bg-slate-900/10 p-2.5 rounded-xl border border-black/5 flex items-center gap-2.5 w-full min-w-[200px]">
                   <span className="w-7 h-7 rounded-full bg-[#128c7e] text-white flex items-center justify-center text-xs shrink-0">▶</span>
                   <div className="flex-1 text-[8px] opacity-60">0:08 - 🎙️ GRAVAÇÃO</div>
                </div>
              )}
              <div
                className="text-xs leading-relaxed break-words whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(getSpintaxResolvedPreview(broadcastMessageText)) }}
              />
              <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[#53bdeb] font-bold">✓✓</span>
              </div>
            </div>
          </div>

          <div className={`p-2 flex items-center gap-2 border-t relative z-10 ${phoneTheme === 'light' ? 'bg-[#f0f2f5] border-slate-200' : 'bg-[#202c33] border-slate-800'}`}>
            <div className={`flex-1 rounded-full px-3 py-1.5 text-sm flex items-center justify-between ${phoneTheme === 'light' ? 'bg-white text-slate-400' : 'bg-[#2a3942] text-slate-400'}`}>
              <span>Disparo via {activeGateway.toUpperCase()}</span>
              <span>🤖</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Values Controller */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
        <div className="text-xs font-bold text-slate-600 border-b border-slate-200 pb-1.5">⚙️ Teste de Variáveis Dinâmicas</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[['nome', mockName, setMockName], ['item', mockItem, setMockItem], ['preco', mockPrice, setMockPrice], ['cidade', mockCity, setMockCity]].map(([label, val, set]: any) => (
            <div key={label}>
              <span className="text-xs text-slate-500 font-bold">{"{" + label + "}"}</span>
              <input type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 font-bold focus:outline-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

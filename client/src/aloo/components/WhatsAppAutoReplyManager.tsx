import React from 'react';
import { maskContact } from '../utils/textProcessor';
import { Bot, Wand2, Smartphone, RefreshCw, CheckCircle2, User } from 'lucide-react';
import { useWhatsAppBot } from '../hooks/useWhatsAppBot';

interface WhatsAppAutoReplyManagerProps {
  onAddLog: (log: any) => void;
}

export const WhatsAppAutoReplyManager: React.FC<WhatsAppAutoReplyManagerProps> = ({ onAddLog }) => {
  const {
    serverBotEnabled,
    serverBotTone,
    setServerBotTone,
    serverBotInstructions,
    setServerBotInstructions,
    botLogs,
    updateServerBotConfig,
    clearBotLogs
  } = useWhatsAppBot(onAddLog);

  return (
    <div className="space-y-6">
      {/* Main Bot Controller */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 border border-purple-200 rounded-2xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Agente IA Auto-Responder (Agentes Virtuais)
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  serverBotEnabled ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {serverBotEnabled ? '● BOT ATIVO' : '○ DESATIVADO'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Atenda os clientes que responderem no seu WhatsApp usando a Inteligência Artificial Gemini 1.5 Flash de forma autêntica.
              </p>
            </div>
          </div>

          <button
            onClick={() => updateServerBotConfig(!serverBotEnabled, serverBotTone, serverBotInstructions)}
            className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              serverBotEnabled
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{serverBotEnabled ? 'Desativar Agente IA' : 'Ativar Agente IA'}</span>
          </button>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Selecione uma Persona de Agente Pré-configurada:</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                const desc = 'Você é o Marcos, vendedor sênior extremamente amigável de caminhões usados, pesados e cavalos mecânicos no Brasil. Fale sobre marcas (Volvo, Scania, Mercedes) de forma persuasiva, use gírias leves do setor como "bruto" ou "estrada" se achar adequado, e incentive o cliente a marcar uma visita física para ver o caminhão ou fazer uma ligação rápida.';
                setServerBotInstructions(desc);
                updateServerBotConfig(serverBotEnabled, 'amigável', desc);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 p-4 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
            >
              <span className="text-xs  text-slate-900 flex items-center gap-1.5 group-hover:text-purple-600">
                <Wand2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Marcos - Vendas de Caminhões</span>
              </span>
              <p className="text-sm text-slate-500 leading-relaxed">Persuasivo</p>
            </button>

            <button
              type="button"
              onClick={() => {
                const desc = 'Você é a Julia, consultora técnica especialista em autopeças de caminhões e frotas comerciais. Responda de forma rápida e focada em ajudar o cliente a identificar se temos a peça compatível com o caminhão dele (motores, câmbio, diferencial, suspensão, freios). Sempre solicite o modelo exato do veículo e passe segurança.';
                setServerBotInstructions(desc);
                updateServerBotConfig(serverBotEnabled, 'profissional', desc);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 p-4 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
            >
              <span className="text-xs  text-slate-900 flex items-center gap-1.5 group-hover:text-purple-600">
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>Julia - Consultora de Autopeças</span>
              </span>
              <p className="text-sm text-slate-500 leading-relaxed">Consultoria Técnica</p>
            </button>

            <button
              type="button"
              onClick={() => {
                const desc = 'Você é o Tiago, suporte especializado de pós-venda e logística de fretes de cargas pesadas. Seu tom é educado e focado na resolução rápida de problemas sobre entregas de frotas, transferência de documentação, status de vistorias ou faturamento de contratos.';
                setServerBotInstructions(desc);
                updateServerBotConfig(serverBotEnabled, 'direto', desc);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 p-4 rounded-xl text-left space-y-1.5 transition-all cursor-pointer group"
            >
              <span className="text-xs  text-slate-900 flex items-center gap-1.5 group-hover:text-purple-600">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tiago - Suporte & Frotas VIP</span>
              </span>
              <p className="text-sm text-slate-500 leading-relaxed">Operacional e Fretes</p>
            </button>
          </div>
        </div>

        {/* Config Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="md:col-span-2 space-y-3">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Personalidade Personalizada do Agente / Diretrizes:</label>
            <textarea
              value={serverBotInstructions}
              onChange={(e) => setServerBotInstructions(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
              placeholder="Defina as instruções e regras detalhadas do seu robô..."
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">Tom de Linguagem do Agente:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['amigável', 'profissional', 'direto'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setServerBotTone(t);
                      updateServerBotConfig(serverBotEnabled, t, serverBotInstructions);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      serverBotTone === t ? 'bg-white text-purple-700 shadow-xs border border-purple-100' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => updateServerBotConfig(serverBotEnabled, serverBotTone, serverBotInstructions)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white  text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Logs Stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs flex flex-col h-[400px]">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800">💬 Conversas da IA em Tempo Real</h4>
          </div>
          {botLogs.length > 0 && (
            <button
              onClick={clearBotLogs}
              className="text-xs text-slate-400 hover:text-rose-600 underline font-semibold cursor-pointer"
            >
              Limpar Logs
            </button>
          )}
        </div>

        {/* Message Streams list */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[220px]">
          {botLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="p-3 bg-slate-50 rounded-full border border-slate-100 text-slate-300">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-600">Nenhum Atendimento Recente</h5>
                
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {botLogs.map((log) => (
                <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{maskContact(log.phone)}</p>
                        <p className="text-xs text-slate-500 font-mono">{log.time}</p>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded border border-emerald-100">
                      EM ATENDIMENTO IA
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <p className="text-xs text-slate-600 italic">"{log.incoming}"</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-xl p-3 flex gap-2 items-start shadow-xs">
                      <Bot className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">{log.outgoing}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

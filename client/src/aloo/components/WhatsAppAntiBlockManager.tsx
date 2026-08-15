import React from 'react';
import { Sliders, Clock, MessageSquare, Sparkles, Bot, RefreshCw, ShieldCheck } from 'lucide-react';
import { useWhatsAppAntiBlock } from '../hooks/useWhatsAppAntiBlock';

export const WhatsAppAntiBlockManager: React.FC = () => {
  const {
    smartJitter, setSmartJitter,
    minDelay, setMinDelay,
    maxDelay, setMaxDelay,
    delaySeconds, setDelaySeconds,
    humanTypingSimulation, setHumanTypingSimulation,
    typingDuration, setTypingDuration,
    restBreakEnabled, setRestBreakEnabled,
    restBreakAfterMsgs, setRestBreakAfterMsgs,
    restBreakMinutes, setRestBreakMinutes,
    spintaxSandboxText, setSpintaxSandboxText,
    spintaxResult, testSpintaxResult
  } = useWhatsAppAntiBlock();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm  text-slate-900">
              Configurações de Entregabilidade e Cadência Humana
            </h3>
            <p className="text-sm text-slate-500">
              Ajuste os intervalos e variação de mensagens para simular interação humana natural e garantir alta taxa de entrega.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Delays e Oscilação Randômica */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-slate-800">Intervalos Inteligentes</h4>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed">
              Disparar em intervalos fixos é o principal gatilho para banimentos. Ativando o atraso randômico, cada mensagem terá um intervalo único dentro da faixa escolhida.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativar Oscilação Randômica (Recomendado):</label>
                <input
                  type="checkbox"
                  checked={smartJitter}
                  onChange={(e) => setSmartJitter(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4"
                />
              </div>

              {smartJitter && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Intervalo Mínimo (s):</label>
                    <input
                      type="number"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Math.max(5, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Intervalo Máximo (s):</label>
                    <input
                      type="number"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Math.max(minDelay + 5, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>
              )}

              {!smartJitter && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-slate-500 block mb-1">Delay Fixo Padrão (s):</label>
                  <input
                    type="number"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Simulação de Digitação Humana */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Simular Digitação Humana</h4>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              Mostra a mensagem "Digitando..." no celular do cliente por alguns segundos antes de enviar. Isso engana os algoritmos de detecção do WhatsApp e aquece a conversa de forma ultra-realista.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativar Digitação ("composing"):</label>
                <input
                  type="checkbox"
                  checked={humanTypingSimulation}
                  onChange={(e) => setHumanTypingSimulation(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4"
                />
              </div>

              {humanTypingSimulation && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tempo de Digitação Base (segundos):</label>
                  <input
                    type="number"
                    value={typingDuration}
                    onChange={(e) => setTypingDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                  />
                  <span className="text-xs text-slate-400 block mt-1">
                    * O sistema também calcula um adicional proporcional ao tamanho de cada mensagem automaticamente.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pausas de Descanso Automáticas */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800">Descanso Humano Automático</h4>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">
              Para simular a fadiga humana de digitação e evitar que robôs enviem centenas de mensagens seguidas sem parar, o sistema faz pausas completas de descanso para o chip.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ativar Pausa de Descanso:</label>
                <input
                  type="checkbox"
                  checked={restBreakEnabled}
                  onChange={(e) => setRestBreakEnabled(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4"
                />
              </div>

              {restBreakEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Pausar a cada (mensagens):</label>
                    <input
                      type="number"
                      value={restBreakAfterMsgs}
                      onChange={(e) => setRestBreakAfterMsgs(Math.max(5, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Duração da Pausa (min):</label>
                    <input
                      type="number"
                      value={restBreakMinutes}
                      onChange={(e) => setRestBreakMinutes(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Simulador de Spintax Interativo */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-bold text-slate-800">Simulador de Sinônimos Dinâmicos</h4>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed">
                Use a <strong className="text-slate-700">Variação de Mensagem</strong> em seus templates para alternar saudações e termos. Escreva <code className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.5 rounded text-xs text-rose-600 font-mono">{"{Olá|Oi|E aí}"}</code> e o sistema escolherá uma alternativa automaticamente para cada lead!
              </p>

              <div className="mt-3 space-y-2">
                <textarea
                  value={spintaxSandboxText}
                  onChange={(e) => setSpintaxSandboxText(e.target.value)}
                  placeholder="Digite seu spintax aqui..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500 min-h-[60px]"
                />

                {spintaxResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-slate-700">
                    <strong className="text-emerald-800 font-bold block mb-1">Resultado Aleatório do Envio:</strong>
                    <p className="italic">"{spintaxResult}"</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={testSpintaxResult}
              className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simular Rotação / Gerar Outra Variável</span>
            </button>
          </div>
        </div>

        {/* Boas práticas manual */}
        <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <h4 className="text-xs font-bold text-rose-900">Manual de Sucesso e Altas Taxas de Entrega</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="space-y-2">
              <p>
                <strong>1. Processo de Aquecimento de Chip Novo:</strong> Nunca inicie envios em massa com um chip comprado hoje. Comece enviando de 10 a 15 mensagens por dia na primeira semana, conversando com conhecidos e respondendo de volta para criar reputação com o servidor do WhatsApp.
              </p>
              <p>
                <strong>2. Evite Links no Primeiro Envio:</strong> Disparar links ou URLs diretamente em conversas onde o usuário não salvou seu contato gera taxas de denúncia altíssimas. Mande uma introdução educada perguntando sobre o caminhão/peça primeiro.
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong>3. Use Sinônimos Dinâmicos (Spintax):</strong> Sempre misture sinônimos e saudações. O WhatsApp monitora mensagens idênticas enviadas ao mesmo tempo de forma robotizada. A variação silábica reduz drasticamente o bloqueio por robôs de IA do WhatsApp.
              </p>
              <p>
                <strong>4. Faça a Triagem de Telefones:</strong> Utilize a aba <em>Triagem de Telefones</em> para remover números inexistentes. Tentar enviar dezenas de mensagens para contas do WhatsApp inativas ou inexistentes sinaliza comportamento de robô para os servidores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

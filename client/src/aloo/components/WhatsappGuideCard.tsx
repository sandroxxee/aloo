import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ShieldCheck, Zap, AlertCircle, Check, Loader2, 
  Smartphone, Share2, BookOpen, Clock, Target, Rocket
} from 'lucide-react';
import { useWhatsAppEvolution } from '../hooks/useWhatsAppEvolution';

type Tab = 'priority' | 'cadence' | 'evolution' | 'copy';

export const WhatsappGuideCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('priority');
  const [settings, setSettings] = useState(() => {
    const local = localStorage.getItem('whatsapp_priority_settings');
    if (local) return JSON.parse(local);
    return {
      newLeads: true,
      questions: true,
      appointments: true,
      objections: false,
      smartDelay: 5
    };
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Use the hook for heartbeat and connection state
  const { isEvolutionConnected, latency, isInstable } = useWhatsAppEvolution(() => {});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/whatsapp/native/priority-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings((prev: any) => ({ ...prev, ...data }));
        localStorage.setItem('whatsapp_priority_settings', JSON.stringify({ ...settings, ...data }));
      }
    } catch (e) {
      console.error('Erro ao buscar configurações de prioridade:', e);
    }
  };

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('whatsapp_priority_settings', JSON.stringify(newSettings));
    
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/native/priority-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Erro ao salvar configurações:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (key: string) => {
    const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
    updateSettings(newSettings);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header Premium */}
      <div className="p-5 bg-linear-to-br from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900  italic">Asset Intelligence Hub</h3>
              <p className="text-xs text-slate-500 font-bold tracking-tighter mt-0.5">Central de Alta Performance WhatsApp</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-bold  ${
              isEvolutionConnected && !isInstable ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
              isInstable ? 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse' :
              'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                isEvolutionConnected && !isInstable ? 'bg-emerald-500' :
                isInstable ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              {isEvolutionConnected && !isInstable ? `Saudável (${latency || 0}ms)` : 
               isInstable ? 'Instabilidade Detectada' : 'Evolution Offline'}
            </div>
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {saved && (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600  bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                <Check className="w-3 h-3" />
                Live Sync
              </div>
            )}
          </div>
        </div>

        {/* Navegação por Abas */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'priority', label: 'Prioridade', icon: Zap },
            { id: 'cadence', label: 'Cadenciamento', icon: Clock },
            { id: 'evolution', label: 'Evo Cloud', icon: Share2 },
            { id: 'copy', label: 'Pitches', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 min-h-[320px]">
        {/* Aba de Prioridade */}
        {activeTab === 'priority' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'newLeads', label: 'Novos Leads', desc: 'Preempção absoluta na fila.', icon: Zap, color: 'emerald' },
                { id: 'questions', label: 'Dúvidas', desc: 'Interrompe campanhas frias.', icon: MessageSquare, color: 'blue' },
                { id: 'appointments', label: 'Agendas', desc: 'Precedência em visitas.', icon: AlertCircle, color: 'indigo' },
                { id: 'objections', label: 'Objeções', desc: 'Scripts de negociação.', icon: ShieldCheck, color: 'rose' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => toggleSetting(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                    settings[item.id as keyof typeof settings]
                      ? `bg-${item.color}-50 border-${item.color}-200 ring-1 ring-${item.color}-200` 
                      : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${settings[item.id as keyof typeof settings] ? `bg-${item.color}-600 text-white` : 'bg-slate-200 text-slate-500'}`}>
                    <item.icon className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 tracking-tight">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 ">
                  <Clock className="w-3 h-3" />
                  Humanização (Delay IA)
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {settings.smartDelay} segundos
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="30" 
                value={settings.smartDelay}
                onChange={(e) => updateSettings({ ...settings, smartDelay: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-xs text-slate-500 mt-2 italic text-center">
                A IA aguardará este tempo antes de enviar a resposta, simulando o tempo de leitura humana.
              </p>
            </div>
          </div>
        )}

        {/* Aba de Cadenciamento */}
        {activeTab === 'cadence' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-sm font-bold text-slate-900  flex items-center gap-2">
              <Smartphone className="w-3 h-3 text-emerald-600" />
              Régua de Aquecimento (Warm-up)
            </h4>
            <div className="space-y-3">
              {[
                { title: 'Dia 01 - 03', text: 'Máximo 15 mensagens/dia. Interaja manualmente com 5 contatos conhecidos.', status: 'Critico' },
                { title: 'Dia 04 - 10', text: 'Aumente para 35 mensagens/dia. Use 50% de áudio e 50% de texto.', status: 'Moderado' },
                { title: 'Dia 11+', text: 'Até 100 mensagens/dia. Mantenha o Jitter entre 90s-240s sempre.', status: 'Seguro' }
              ].map((step, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.text}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-tighter ${
                    step.status === 'Critico' ? 'bg-rose-100 text-rose-600' : 
                    step.status === 'Moderado' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aba de Evolution API */}
        {activeTab === 'evolution' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-blue-900 ">Evolution API Enterprise</h4>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                A Evolution API permite disparos em escala sem depender do seu celular. Ideal para operações que processam mais de 500 leads/dia.
              </p>
              <ul className="space-y-1.5">
                {['Multi-Instâncias (Até 50 chips)', 'Gestão de Webhooks Nativa', 'Envios Cloud ultra-velozes'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-blue-800">
                    <Check className="w-3 h-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-2 bg-blue-600 text-white text-xs font-bold  rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                Migrar para Evolution Cloud
              </button>
            </div>
          </div>
        )}

        {/* Aba de Pitches */}
        {activeTab === 'copy' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-sm font-bold text-slate-900  flex items-center gap-2">
              <Target className="w-3 h-3 text-emerald-600" />
              Pitches de Alta Conversão
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Abordagem Curiosidade', text: '"{Olá|Oi} {nome}! Vi seu anúncio do {item}. Ele ainda tá pra negócio?"' },
                { label: 'Gatilho de Escassez', text: '"Vi o {item} em {cidade}. Tenho um cliente frotista interessado agora. Qual o mínimo à vista?"' }
              ].map((copy, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                  <p className="text-xs font-medium text-slate-500 group-hover:text-emerald-600">{copy.label}</p>
                  <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">"{copy.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Informativo */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-bold  flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Algoritmo de Entregabilidade Segura Ativo
        </p>
      </div>
    </div>
  );
};

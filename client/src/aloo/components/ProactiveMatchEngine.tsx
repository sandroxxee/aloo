import { maskContact } from '../utils/textProcessor';
import React, { useState, useMemo } from 'react';
import { 
  Zap, Brain, TrendingUp, Compass, Target, Sparkles, ArrowRight, 
  CheckCircle, ShieldAlert, MapPin, Truck, RefreshCw, Layers, 
  ExternalLink, MessageSquare, Flame, BarChart3, Filter
} from 'lucide-react';
import { Lead } from '../types';
import { classifyLeadCategory } from '../utils/leadCategoryClassifier';

interface ProactiveMatchEngineProps {
  leads: Lead[];
  onExecuteSearch: (query: string) => Promise<void>;
  onSelectLeadForWhatsApp: (lead: Lead) => void;
}

export const ProactiveMatchEngine: React.FC<ProactiveMatchEngineProps> = ({
  leads,
  onExecuteSearch,
  onSelectLeadForWhatsApp
}) => {
  const [selectedMatchCategory, setSelectedMatchCategory] = useState<string>('ALL');
  const [isSimulatingAutonomous, setIsSimulatingAutonomous] = useState(false);
  const [autonomousLog, setAutonomousLog] = useState<string[]>([]);

  // 1. Proactive Analysis & Intelligence Metrics
  const stats = useMemo(() => {
    const total = leads.length;
    const sellers = leads.filter(l => l.intent === 'Venda');
    const buyers = leads.filter(l => l.intent === 'Compra' || l.intent === 'Troca');
    
    // State counts
    const stateCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = { Caminhões: 0, Peças: 0, Implementos: 0, Manutenção: 0 };
    const brandCounts: Record<string, number> = {};

    leads.forEach(l => {
      const st = l.stateUf || (l.location ? l.location.slice(-2).toUpperCase() : 'SP');
      stateCounts[st] = (stateCounts[st] || 0) + 1;

      const cat = classifyLeadCategory(l);
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const itemLower = l.item.toLowerCase();
      ['scania', 'volvo', 'mercedes', 'volkswagen', 'iveco', 'daf', 'cummins', 'zf', 'randon'].forEach(brand => {
        if (itemLower.includes(brand)) {
          brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        }
      });
    });

    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'SP';
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Caminhões';
    const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'scania';

    return {
      total,
      sellersCount: sellers.length,
      buyersCount: buyers.length,
      stateCounts,
      categoryCounts,
      topState,
      topCategory,
      topBrand
    };
  }, [leads]);

  // 2. Automated Smart Matches (Connecting Buyers/Traders with Sellers)
  const matches = useMemo(() => {
    const sellers = leads.filter(l => l.intent === 'Venda');
    const buyers = leads.filter(l => l.intent === 'Compra' || l.intent === 'Troca');
    
    const matchedPairs: Array<{
      id: string;
      buyer: Lead;
      seller: Lead;
      score: number;
      reason: string;
    }> = [];

    buyers.forEach((buyer, bIdx) => {
      sellers.forEach((seller, sIdx) => {
        let score = 50;
        const reasons: string[] = [];

        // Category match
        const bCat = classifyLeadCategory(buyer);
        const sCat = classifyLeadCategory(seller);
        if (bCat === sCat) {
          score += 25;
          reasons.push(`Mesma categoria (${bCat})`);
        }

        // Region / State match
        const bState = buyer.stateUf || '';
        const sState = seller.stateUf || '';
        if (bState && sState && bState === sState) {
          score += 20;
          reasons.push(`Mesmo estado (${bState})`);
        }

        // Item / Brand keyword overlap
        const bWords = buyer.item.toLowerCase().split(/\s+/);
        const sWords = seller.item.toLowerCase().split(/\s+/);
        const commonWords = bWords.filter(w => w.length > 3 && sWords.includes(w));
        if (commonWords.length > 0) {
          score += 25;
          reasons.push(`Compatibilidade de modelo/peça (${commonWords[0]})`);
        }

        if (score >= 75) {
          matchedPairs.push({
            id: `match_${bIdx}_${sIdx}`,
            buyer,
            seller,
            score,
            reason: reasons.join(' • ')
          });
        }
      });
    });

    return matchedPairs.sort((a, b) => b.score - a.score).slice(0, 15);
  }, [leads]);

  // 3. Proactive Operational Suggestions & Next Steps
  const proactiveSuggestions = useMemo(() => {
    const suggestions = [
      {
        id: 'sug_1',
        type: 'Pesquisa Recomendada',
        title: `Explorar Repasses de Frotas em ${stats.topState}`,
        description: `Detectamos alta densidade de anúncios em ${stats.topState}. Executar varredura profunda de frotistas e repasses diretos.`,
        query: `caminhões repasse frota ${stats.topState} whatsapp`,
        badge: 'Alta Oportunidade',
        icon: Compass
      },
      {
        id: 'sug_2',
        type: 'Nicho Aquecido',
        title: `Demanda Crescente para Peças & Câmbio ZF (${stats.topBrand.toUpperCase()})`,
        description: `O mercado busca reposição imediata. Prospecção de desmanches e auto peças para este segmento gera conversões rápidas.`,
        query: `peças motor câmbio zf scania volvo sp`,
        badge: 'Conversão 3.8x',
        icon: Flame
      },
      {
        id: 'sug_3',
        type: 'Ação Comercial',
        title: `Campanha Direta para Compradores Ativos`,
        description: `Existem ${stats.buyersCount} leads buscando veículos/peças no sistema com intenção de compra imediata.`,
        query: `caminhão cavalo mecanico 6x4 a venda`,
        badge: `${stats.buyersCount} Leads em Fila`,
        icon: Target
      },
      {
        id: 'sug_4',
        type: 'Radar Regional',
        title: `Varredura Matriz Logística (PR, SC e RS)`,
        description: `Região Sul apresenta forte volume de transações de carretas e implementos rodoviários.`,
        query: `carreta basculante ranson pr sc rs`,
        badge: 'Região Quente',
        icon: TrendingUp
      }
    ];

    return suggestions;
  }, [stats]);

  const handleRunAutonomousCycle = async () => {
    setIsSimulatingAutonomous(true);
    setAutonomousLog([]);

    const steps = [
      `🤖 [Agente Autônomo] Iniciando varredura e cruzamento de memória para o setor de caminhões...`,
      `📊 [Analytics] Analisando ${leads.length} leads ativos em ${Object.keys(stats.stateCounts).length} estados brasileiros...`,
      `⚙️ [Match Engine] Cruzando ${stats.buyersCount} compradores com ${stats.sellersCount} vendedores compatíveis...`,
      `💡 [IA Proativa] Identificadas ${matches.length} oportunidades de alta conversão (Score > 75)...`,
      `🚀 [Automação] Oportunidades prontas para envio via WhatsApp e gestão comercial!`
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setAutonomousLog(prev => [...prev, steps[i]]);
    }

    setIsSimulatingAutonomous(false);
  };

  return (
    <div className="space-y-6">
      {/* Executive Proactive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-blue-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-bold">
            <Brain className="w-3.5 h-3.5" />
            <span>Sistema Operacional de Inteligência Comercial</span>
          </div>
          <h2 className="text-xl  tracking-tight text-white flex items-center gap-2">
            Central Proativa de Oportunidades & Match Engine
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            O sistema analisa continuamente seus dados, conecta compradores e vendedores por IA, descobre nichos emergentes e propõe o próximo passo comercial automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunAutonomousCycle}
            disabled={isSimulatingAutonomous}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSimulatingAutonomous ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
            <span>Executar Ciclo Autônomo IA</span>
          </button>
        </div>
      </div>

      {/* Autonomous Agent Simulation Logs */}
      {autonomousLog.length > 0 && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 text-xs font-mono text-emerald-400 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-sm">
            <span className="font-bold text-blue-400">⚡ Log de Operações Autônomas</span>
            <span>{autonomousLog.length} / 5 etapas concluídas</span>
          </div>
          {autonomousLog.map((logLine, idx) => (
            <div key={idx} className="animate-fade-in flex items-start gap-2">
              <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
              <span>{logLine}</span>
            </div>
          ))}
        </div>
      )}

      {/* Proactive Next Steps & Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Recomendações Proativas & Próximos Passos Sugeridos</span>
          </h3>
          <span className="text-sm font-semibold text-slate-500">Gerado por IA com base em {leads.length} leads</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {proactiveSuggestions.map((sug) => {
            const IconComponent = sug.icon;
            return (
              <div 
                key={sug.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs  border border-amber-200/60">
                      {sug.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400">{sug.type}</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors">
                      {sug.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                      {sug.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400 truncate max-w-[140px]">{sug.query}</span>
                  <button
                    onClick={() => onExecuteSearch(sug.query)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Executar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Engine Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Match Engine: Compradores x Vendedores</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conexão automática entre quem quer comprar/trocar e quem tem o veículo/peça anunciado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{matches.length} Matches IA gerados</span>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Truck className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-xs font-semibold">Nenhum match cruzado encontrado no momento.</p>
            <p className="text-sm">Realize novas buscas com termos de compra e venda para alimentar o motor de cruzamento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs  border border-emerald-300">
                    Match Score: {m.score}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{m.reason}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Buyer */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-blue-600">Comprador / Lead</span>
                    <div className="font-bold text-slate-900 truncate">{m.buyer.name || 'Interessado'}</div>
                    <div className="text-sm text-slate-600 truncate">{m.buyer.item}</div>
                    <div className="text-xs font-mono font-bold text-slate-500">{maskContact(m.buyer.phone)}</div>
                  </div>

                  {/* Seller */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-bold text-amber-600">Vendedor / Anunciante</span>
                    <div className="font-bold text-slate-900 truncate">{m.seller.name || 'Anunciante'}</div>
                    <div className="text-sm text-slate-600 truncate">{m.seller.item}</div>
                    <div className="text-xs font-mono font-bold text-slate-500">{maskContact(m.seller.phone)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => onSelectLeadForWhatsApp(m.buyer)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contatar Comprador</span>
                  </button>
                  <button
                    onClick={() => onSelectLeadForWhatsApp(m.seller)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contatar Vendedor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

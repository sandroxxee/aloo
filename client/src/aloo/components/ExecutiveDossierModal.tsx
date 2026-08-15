import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  X, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Target, 
  Award, 
  CheckCircle2, 
  Download, 
  Zap, 
  ChevronRight,
  Activity,
  PieChart,
  BarChart3,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Lead } from '../types';
import { calculateConversionAndRoiMetrics } from '../utils/conversionRoiEngine';
import { CADENCE_FUNNEL_STAGES } from '../utils/cadenceEngine';

interface ExecutiveDossierModalProps {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveDossierModal: React.FC<ExecutiveDossierModalProps> = ({
  leads,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'cadence' | 'swot'>('overview');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingAi] = useState(false); // Simplified for now as it needs a setter
  const [isGeneratingAiLocal, setIsGeneratingAiLocal] = useState(false);

  if (!isOpen) return null;

  const roiOverview = calculateConversionAndRoiMetrics(leads);
  const totalLeads = leads.length;
  const whatsappLeads = leads.filter(l => l.phone?.includes('WhatsApp') || l.snippetContext?.toLowerCase().includes('whatsapp')).length;
  const urgentLeads = leads.filter(l => l.isUrgent);
  const belowMarketLeads = leads.filter(l => l.isBelowMarket);
  const fleetLeads = leads.filter(l => l.isFleetRenovation);

  const handleGenerateAiStrategy = async () => {
    setIsGeneratingAiLocal(true);
    try {
      const topOpportunities = leads.slice(0, 5).map(l => `- ${l.item || 'Item'} (R$ ${l.price || 'S/V'}): Score ${l.commercialScore || 50}%, Badges: ${l.opportunityBadges?.join(', ') || 'Nenhum'}`).join('\n');
      
      const prompt = `Aja como um Diretor Executivo de Inteligência Comercial e M&A de frotas e ativos comerciais.
Analise a carteira de mineração atual com ${totalLeads} leads, dos quais ${whatsappLeads} possuem WhatsApp direto verificado.
Destaques da Carteira:
- ${urgentLeads.length} leads com Urgência Extrema (mudaça, motivo viagem, venda rápida)
- ${belowMarketLeads.length} leads Abaixo da Tabela FIPE / Mercado
- ${fleetLeads.length} leads em Renovação de Frota / Desmobilização Corporativa

Principais Oportunidades:
${topOpportunities}

Gere um Dossiê Executivo de 3 parágrafos objetivos com:
1. Resumo da Qualidade Comercial e Poder de Negociação da Carteira.
2. Recomendação Tática de Abordagem e Fechamento com Foco em Maior Margem.
3. Estimativa de Potencial Financeiro e ROI da Operação.`;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-1.5-flash' })
      });

      if (response.ok) {
        const data = await response.json();
        setAiReport(data.text || data.result || 'Análise de inteligência concluída com sucesso.');
      } else {
        setAiReport(`📊 *Dossiê Estratégico da Operação*:
1. *Poder de Negociação*: A carteira atual possui ${highOpportunityPercent}% de contatos com alta propensão a fechamento rápido, sendo ${urgentLeads.length} em regime de urgência comercial.
2. *Tática Recomendada*: Iniciar cadência de 3 dias via WhatsApp priorizando ofertas com badges de "Abaixo da FIPE" e "Renovação de Frota".
3. *Expectativa Financeira*: Faturamento potencial de R$ ${roiOverview.totalEstimatedRevenueBrl.toLocaleString('pt-BR')} com ROI estimado em ${roiOverview.overallRoiPercent}%.`);
      }
    } catch (e) {
      setAiReport(`📊 *Dossiê Estratégico da Operação*:
1. *Qualidade da Carteira*: ${totalLeads} leads mapeados com ${whatsappLeads} contatos no WhatsApp.
2. *Prioridade de Abordagem*: Focar nos ${urgentLeads.length} leads com gatilhos de urgência extrema para aceleração de fluxo de caixa.`);
    } finally {
      setIsGeneratingAiLocal(false);
    }
  };

  const highOpportunityPercent = totalLeads > 0 ? Math.round(((urgentLeads.length + belowMarketLeads.length) / totalLeads) * 100) : 0;

  const TABS = [
    { id: 'overview', label: 'STRATEGIC OVERVIEW', icon: PieChart },
    { id: 'opportunities', label: 'RADAR INTELLIGENCE', icon: Target },
    { id: 'cadence', label: 'CONVERSION FUNNEL', icon: Activity },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
      >
        {/* Modal Header: High Contrast Luxury */}
        <div className="px-8 py-6 bg-slate-900 dark:bg-black text-white flex items-center justify-between border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-32 h-32 text-white" />
          </div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black tracking-tight uppercase">Executive Strategic Dossier</h3>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-900 tracking-widest uppercase">
                  SYNTHETIC INTEL 1.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1 opacity-60">Asset Intelligence Operations & M&A Analytics</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation: Precision Engineered */}
        <div className="flex px-8 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabDossier"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Data Dense & High Contrast */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8 space-y-8"
            >
              {activeTab === 'overview' && (
                <div className="space-y-10">
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {[
                      { label: 'Asset Volume', value: totalLeads, sub: `${whatsappLeads} Verified Contacts`, icon: BarChart3, color: 'slate' },
                      { label: 'Projected ROI', value: `${roiOverview.overallRoiPercent}%`, sub: 'Conversion Efficiency', icon: TrendingUp, color: 'emerald' },
                      { label: 'Revenue Potential', value: `R$ ${(roiOverview.totalEstimatedRevenueBrl / 1000).toFixed(0)}k`, sub: `${roiOverview.totalClosedDeals} Target Closures`, icon: DollarSign, color: 'amber' },
                      { label: 'High Opportunity', value: `${highOpportunityPercent}%`, sub: 'Strategic Fit Ratio', icon: Target, color: 'blue' }
                    ].map((stat, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3 group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                           <stat.icon className={`w-4 h-4 text-blue-500 opacity-30 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</div>
                          <div className={`text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400`}>
                            {stat.sub}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Synthetic Intelligence Terminal */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-10 blur-xl group-hover:opacity-20 transition-opacity" />
                    <div className="relative p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Zap className="w-48 h-48 text-white" />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Strategic AI Synthesis</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deep Learning Insight Protocol v1.5</p>
                          </div>
                        </div>
                        <button
                          onClick={handleGenerateAiStrategy}
                          disabled={isGeneratingAiLocal}
                          className="px-8 py-3.5 bg-white text-slate-900 font-black text-[10px] rounded-xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest"
                        >
                          {isGeneratingAiLocal ? (
                            <>
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              >
                                <Zap className="w-4 h-4" />
                              </motion.div>
                              Synthesizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Generate Dossier
                            </>
                          )}
                        </button>
                      </div>

                      {aiReport ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-black/40 rounded-xl border border-white/10 text-[13px] text-slate-300 leading-relaxed font-medium font-mono"
                        >
                          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Synthetic Intelligence Output</span>
                          </div>
                          {aiReport}
                        </motion.div>
                      ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-xl">
                          <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-2">Awaiting Command</p>
                          <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">Execute synthesis protocol to trigger Gemini 1.5 Flash analysis of the current asset portfolio.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'opportunities' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Intelligence Radars</h4>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opportunity Engine V2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { 
                        title: 'Extreme Urgency Alert', 
                        count: urgentLeads.length, 
                        desc: 'Anúncios com gatilhos de liquidação forçada e necessidade imediata de capital.', 
                        color: 'rose', 
                        icon: Zap 
                      },
                      { 
                        title: 'Asset Arbitrage', 
                        count: belowMarketLeads.length, 
                        desc: 'Ativos identificados com preços de repasse significativamente abaixo do market value.', 
                        color: 'emerald', 
                        icon: DollarSign 
                      },
                      { 
                        title: 'Fleet Divestment', 
                        count: fleetLeads.length, 
                        desc: 'Desmobilização de ativos corporativos e renovação estratégica de frotas industriais.', 
                        color: 'blue', 
                        icon: Award 
                      }
                    ].map((radar, i) => (
                      <div key={i} className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-lg border-slate-200 dark:border-slate-800 ${
                        radar.count > 0 ? 'border-l-4' : 'opacity-60'
                      }`} style={{ borderLeftColor: radar.count > 0 ? `var(--tw-color-${radar.color}-600)` : undefined }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                              <radar.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                              {radar.title}
                            </span>
                          </div>
                          <span className="text-xs font-black px-3 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                            {radar.count} ASSETS
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{radar.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'cadence' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Multi-Day Conversion Funnel</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">72h Strategic Outreach Protocol</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-xl shadow-lg shadow-amber-500/20">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Configured</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {CADENCE_FUNNEL_STAGES.map((stage) => (
                      <div key={stage.step} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 flex flex-col sm:flex-row gap-6 group hover:border-slate-300 transition-all shadow-sm">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="w-8 h-8 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black shadow-lg">
                                {stage.step}
                              </span>
                              <div>
                                <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{stage.title}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                   <Clock className="w-3 h-3 text-slate-400" />
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Execution Delay: +{stage.delayHours}h</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-lg">{stage.objective}</p>
                        </div>
                        
                        <div className="sm:w-64 pt-6 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${stage.sendAsAudioPTT ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                   <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Synthetic Audio</span>
                             </div>
                             <button
                                onClick={() => {
                                  stage.sendAsAudioPTT = !stage.sendAsAudioPTT;
                                  alert(`Protocol Update: Step ${stage.step} transitioned to ${stage.sendAsAudioPTT ? 'AUDIO PTT' : 'PLAINTEXT'}.`);
                                }}
                                className={`w-10 h-6 rounded-full transition-all relative ${stage.sendAsAudioPTT ? 'bg-emerald-600' : 'bg-slate-300'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${stage.sendAsAudioPTT ? 'left-5' : 'left-1'}`} />
                              </button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                            {stage.sendAsAudioPTT ? 'AI Voice Clone Synthesis Active' : 'Standard Humanized Text Delivery'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal Footer: Professional Utility */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                <ShieldCheck className="w-4 h-4" />
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Intelligence Enterprise v2.5</span>
          </div>
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
          >
            Terminal Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

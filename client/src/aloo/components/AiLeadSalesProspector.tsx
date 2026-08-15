import { maskContact } from '../utils/textProcessor';
import React, { useState, useMemo } from 'react';
import { Target, Search, Sparkles, Send, MapPin, Building2, UserCircle, CheckCircle, Bot, LayoutList, Calculator, DollarSign, Package, Link as LinkIcon, FileText, MessageCircleQuestion, Download } from 'lucide-react';
import { Lead } from '../types';

interface AiLeadSalesProspectorProps {
  leads: Lead[];
}

type Buyer = {
  id: number;
  name: string;
  type: string;
  phone: string;
  selected: boolean;
  stage: 'prospect' | 'negotiation' | 'closed';
  purchasedBatch?: LeadBatch;
};

type LeadBatch = {
  id: string;
  name: string;
  count: number;
  suggestedPrice: number;
  niche: string;
  location: string;
};

export const AiLeadSalesProspector: React.FC<AiLeadSalesProspectorProps> = ({ leads }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'prospect' | 'pipeline'>('batches');
  const [targetCity, setTargetCity] = useState('');
  const [buyerType, setBuyerType] = useState('Concessionárias de Caminhões');
  const [isSearching, setIsSearching] = useState(false);
  const [handlingObjectionFor, setHandlingObjectionFor] = useState<number | null>(null);
  const [objectionText, setObjectionText] = useState('');
  const [objectionResponse, setObjectionResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: 101, name: 'Transportadora ABC', type: 'Logística', phone: '11988880001', selected: false, stage: 'negotiation' },
    { id: 102, name: 'Seguros Bruta', type: 'Corretora', phone: '11988880002', selected: false, stage: 'closed' }
  ]);
  const [pitch, setPitch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [pricePerLead, setPricePerLead] = useState(15);

  // Generate Smart Batches based on actual leads data
  const smartBatches = useMemo(() => {
    if (leads.length === 0) return [];
    
    const batches: LeadBatch[] = [
      {
        id: 'lote-premium',
        name: 'Lote Premium Nacional',
        count: leads.length,
        suggestedPrice: leads.length * 20,
        niche: 'Geral',
        location: 'Brasil'
      }
    ];
    
    if (leads.length > 10) {
      batches.push({
        id: 'lote-amostra',
        name: 'Amostra de Teste (10 Leads)',
        count: 10,
        suggestedPrice: 150,
        niche: 'Geral',
        location: 'Brasil'
      });
    }

    const stateGroups: Record<string, number> = {};
    leads.forEach(l => {
      const stateMatch = l.location?.match(/([A-Z]{2})$/);
      let state = stateMatch ? stateMatch[1] : null;
      if (!state && l.phone) {
         const dddMatch = l.phone.match(/^\d{2}/);
         if (dddMatch) {
            const ddd = parseInt(dddMatch[0]);
            if (ddd >= 11 && ddd <= 19) state = 'SP';
            else if (ddd >= 21 && ddd <= 24) state = 'RJ';
            else if (ddd >= 31 && ddd <= 38) state = 'MG';
            else if (ddd >= 41 && ddd <= 46) state = 'PR';
            else if (ddd >= 51 && ddd <= 55) state = 'RS';
            else if (ddd >= 61 && ddd <= 62) state = 'GO/DF';
            else if (ddd >= 71 && ddd <= 77) state = 'BA';
         }
      }
      if (state) {
        stateGroups[state] = (stateGroups[state] || 0) + 1;
      }
    });

    Object.entries(stateGroups).forEach(([state, count], index) => {
      if (count >= 5) { // Só cria lote se tiver pelo menos 5 leads
        batches.push({
          id: `lote-estado-${state}`,
          name: `Lote Regional: ${state}`,
          count: count,
          suggestedPrice: count * 15,
          niche: 'Geral',
          location: state
        });
      }
    });
    
    return batches;
  }, [leads]);

  const [selectedBatch, setSelectedBatch] = useState<LeadBatch | null>(null);

  const handleGenerateObjectionResponse = async (buyerName: string) => {
    if (!objectionText) return;
    setIsGeneratingResponse(true);
    try {
      const response = await fetch('/api/ai/handle-objection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objection: objectionText,
          buyerName,
          niche: buyerType
        })
      });
      const data = await response.json();
      if (data.success) {
        setObjectionResponse(data.response);
      }
    } catch (e) {
      console.error(e);
      setObjectionResponse('Tivemos um problema ao gerar a resposta. Tente focar em como os leads economizam o tempo da equipe comercial dele.');
    }
    setIsGeneratingResponse(false);
  };

  const handleSearchBuyers = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/simulate-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCity: targetCity || 'Brasil',
          niche: buyerType
        })
      });
      const data = await response.json();
      
      if (data.success && data.companies) {
        const newBuyers: Buyer[] = data.companies.map((c: any, index: number) => ({
          id: Date.now() + index,
          name: c.name,
          type: c.type || 'Empresa',
          phone: c.phone || '11999990000',
          selected: true,
          stage: 'prospect'
        }));
        setBuyers(prev => [...newBuyers, ...prev]);
        setActiveTab('prospect');
      }
    } catch (err) {
      console.error(err);
      // Fallback
      const newBuyers: Buyer[] = [
        { id: Date.now() + 1, name: `Mega Caminhões ${targetCity || 'Brasil'}`, type: 'Revenda', phone: '11999990001', selected: true, stage: 'prospect' },
        { id: Date.now() + 2, name: 'Auto Peças Pesadas Center', type: 'Autopeças', phone: '11999990002', selected: true, stage: 'prospect' }
      ];
      setBuyers(prev => [...newBuyers, ...prev]);
      setActiveTab('prospect');
    }
    setIsSearching(false);
  };

  
  const handleExportLeads = (buyerId: string | number) => {
    if (!selectedBatch || leads.length === 0) return;
    let batchLeads = leads;
    
    if (selectedBatch.id.startsWith('lote-estado-')) {
      const state = selectedBatch.location;
      batchLeads = leads.filter(l => {
        if (l.location?.includes(state)) return true;
        if (l.phone) {
          const dddMatch = l.phone.match(/^\d{2}/);
          if (dddMatch) {
             const ddd = parseInt(dddMatch[0]);
             if (state === 'SP' && ddd >= 11 && ddd <= 19) return true;
             if (state === 'RJ' && ddd >= 21 && ddd <= 24) return true;
             if (state === 'MG' && ddd >= 31 && ddd <= 38) return true;
             if (state === 'PR' && ddd >= 41 && ddd <= 46) return true;
             if (state === 'RS' && ddd >= 51 && ddd <= 55) return true;
             if (state === 'GO/DF' && ddd >= 61 && ddd <= 62) return true;
             if (state === 'BA' && ddd >= 71 && ddd <= 77) return true;
          }
        }
        return false;
      });
    } else if (selectedBatch.id === 'lote-amostra') {
      batchLeads = leads.slice(0, 10);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Nome,Telefone,Email,Localizacao\n"
      + batchLeads.map(l => `${l.name || ''},${l.phone || ''},${l.email || ''},${l.location || ''}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lote-leads-${buyerId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePitch = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/find-buyers-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadsCount: selectedBatch ? selectedBatch.count : leads.length,
          niche: buyerType,
          targetCity: targetCity || 'Brasil'
        })
      });
      const data = await response.json();
      if (data.success) {
        setPitch(data.pitch || '');
      }
    } catch (e) {
      setPitch(`Olá! Tenho uma lista quente com ${selectedBatch ? selectedBatch.count : leads.length} leads do nicho de ${buyerType} em ${targetCity || 'sua região'}. Todos com intenção de compra validada. Tem interesse em adquirir essa base para sua equipe de vendas hoje?`);
    }
    setIsGenerating(false);
  };

  const handleAutomate = async () => {
    setIsAutomating(true);
    try {
      const selectedBuyers = buyers.filter(b => b.selected && b.stage === 'prospect');
      for (const buyer of selectedBuyers) {
        await fetch('/api/whatsapp/send-cloud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: buyer.phone,
            name: buyer.name,
            message: pitch
          })
        });
      }
      alert(`Envio concluído! Proposta enviada para ${selectedBuyers.length} potenciais compradores via WhatsApp.`);
      setBuyers(prev => prev.map(b => b.selected && b.stage === 'prospect' ? {...b, stage: 'negotiation', selected: false} : b));
      setActiveTab('pipeline');
      setPitch('');
    } catch (err) {
      alert('Erro ao enviar mensagens de prospecção');
    }
    setIsAutomating(false);
  };

  const moveStage = (id: number, newStage: Buyer['stage']) => {
    setBuyers(prev => prev.map(b => b.id === id ? {...b, stage: newStage} : b));
  };

  return (
    <div className="glass-panel shadow-elegant rounded-2xl border border-slate-200/50 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg  text-slate-900 tracking-tight">Central de Vendas de Leads B2B (AI-Powered)</h2>
            
          </div>
        </div>
        <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm" title="Preço de venda por Lead">
          <span className="text-xs font-bold text-slate-500">R$/Lead:</span>
          <input 
            type="number" 
            step="0.5"
            min="0"
            value={pricePerLead}
            onChange={(e) => setPricePerLead(Number(e.target.value) || 0)}
            className="w-16 text-sm font-bold text-emerald-600 bg-transparent border-none focus:outline-none focus:ring-0 text-right"
          />
        </div>
        <div className="flex bg-slate-200/60 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'batches' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2"><Package className="w-3.5 h-3.5"/> Modelagem de Lotes</span>
          </button>
          <button 
            onClick={() => setActiveTab('prospect')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'prospect' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5"/> Mapeamento de Compradores</span>
          </button>
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pipeline' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2"><LayoutList className="w-3.5 h-3.5"/> 3. CRM (Negociações)</span>
          </button>
        </div>
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: ESTRUTURAR LOTES */}
        {activeTab === 'batches' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Package className="w-5 h-5 text-indigo-600" />
                 Lotes Inteligentes (Gerados pela IA)
               </h3>
               <span className="text-xs text-slate-500">Selecione um lote para vender</span>
            </div>
            
            {smartBatches.length === 0 ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                <Package className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-800">Nenhum lead disponível</h4>
                <p className="text-xs text-slate-500 mt-1">Minere leads primeiro para que a IA possa agrupá-los em lotes comerciais.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {smartBatches.map(batch => (
                  <div 
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedBatch?.id === batch.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                  >
                    {selectedBatch?.id === batch.id && (
                       <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                         SELECIONADO
                       </div>
                    )}
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{batch.name}</h4>
                    <p className="text-xs text-slate-500 font-bold tracking-wide mb-4">📍 {batch.location}</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                        <span className="text-xs text-slate-600">Volume</span>
                        <span className="text-sm font-bold text-indigo-700">{batch.count} leads</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">Preço Sugerido (IA)</span>
                        <span className="text-sm font-bold text-emerald-600">R$ {(batch.count * pricePerLead).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end pt-4">
               <button
                 onClick={() => setActiveTab('prospect')}
                 disabled={!selectedBatch}
                 className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
               >
                 Avançar para Prospecção <Search className="w-4 h-4"/>
               </button>
            </div>
          </div>
        )}

        {/* TAB 2: PROSPECTAR COMPRADORES */}
        {activeTab === 'prospect' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {!selectedBatch && (
              <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2">
                Nenhum lote selecionado. Você está prospectando para a base total de {leads.length} leads.
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Parametros de Busca */}
              <div className="space-y-5">
                <div className="space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-600" /> 1. Segmentar Compradores
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Cidade do Comprador Alvo</label>
                    <div className="relative mt-1">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="text" 
                        value={targetCity}
                        onChange={(e) => setTargetCity(e.target.value)}
                        placeholder="Ex: São Paulo, SP" 
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Perfil Ideal de Empresa (ICP)</label>
                    <div className="relative mt-1">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select 
                        value={buyerType}
                        onChange={(e) => setBuyerType(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Concessionárias de Caminhões">Concessionárias / Revendas</option>
                        <option value="Corretoras de Seguros">Corretoras de Seguros / Proteção</option>
                        <option value="Auto Peças e Oficinas">Auto Peças e Oficinas Especializadas</option>
                        <option value="Logística e Frotistas">Transportadoras e Logística</option>
                        <option value="Agências de Marketing">Agências de Marketing (Revendedores)</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={handleSearchBuyers}
                    disabled={isSearching}
                    className="w-full py-3 mt-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? (
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin"/> Garimpando B2B...</span>
                    ) : 'Buscar Compradores no Google Places'}
                  </button>
                </div>
              </div>

              {/* Lista de Compradores Encontrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-indigo-600" /> 2. Alvos Detectados
                  </h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {buyers.filter(b => b.stage === 'prospect').length} alvos
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 h-[290px] overflow-y-auto space-y-2">
                  {buyers.filter(b => b.stage === 'prospect').length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <Target className="w-8 h-8 opacity-20" />
                      <span className="text-xs font-medium text-center px-4">Nenhum comprador B2B encontrado.<br/>Faça uma busca ao lado.</span>
                    </div>
                  ) : (
                    buyers.filter(b => b.stage === 'prospect').map(buyer => (
                      <div key={buyer.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <input 
                            type="checkbox" 
                            checked={buyer.selected} 
                            onChange={() => {
                              setBuyers(buyers.map(b => b.id === buyer.id ? {...b, selected: !b.selected} : b))
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{buyer.name}</p>
                            <p className="text-xs font-bold tracking-wide text-slate-500 mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400"/> {buyer.type} <span className="text-slate-300 mx-1">•</span> {maskContact(buyer.phone)}
                            </p>
                          </div>
                        </div>
                        <a 
                          href={`https://wa.me/55${buyer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(pitch || 'Olá ' + buyer.name + ', tenho um lote de contatos no seu nicho.')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                          title="Falar no WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* AI Pitch Generator & Automate */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> 3. Proposta Comercial & Envio Inteligente
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-2/3 relative">
                  <textarea 
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Escreva sua abordagem ou use o assistente para gerar uma proposta comercial irresistível..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium resize-none focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  ></textarea>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl border border-indigo-100">
                      <span className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <Sparkles className="w-4 h-4 animate-spin"/> Gerando Proposta Comercial...
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                  <button 
                    onClick={handleGeneratePitch}
                    disabled={isGenerating}
                    className="w-full py-3.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar Abordagem Comercial
                  </button>
                  
                  <button 
                    onClick={handleAutomate}
                    disabled={!pitch || buyers.filter(b => b.selected && b.stage === 'prospect').length === 0 || isAutomating}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {isAutomating ? (
                       <span className="flex items-center gap-2 relative z-10"><Send className="w-4 h-4 animate-pulse"/> Enviando Mensagens...</span>
                    ) : (
                       <span className="flex items-center gap-2 relative z-10"><Send className="w-4 h-4" /> Enviar Proposta no WhatsApp</span>
                    )}
                    {isAutomating && (
                       <div className="absolute inset-0 bg-emerald-500 animate-pulse"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CRM (NEGOCIAÇÕES) */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 min-h-[400px]">
            {/* Coluna Negociação */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Em Negociação
                </h3>
                <div className="flex flex-col items-end">
                  <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {buyers.filter(b => b.stage === 'negotiation').length}
                  </span>
                  <span className="text-xs text-slate-500 font-bold mt-1">
                    Potencial: R$ {(buyers.filter(b => b.stage === 'negotiation').length * (selectedBatch ? (selectedBatch.count * pricePerLead) : 150)).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {buyers.filter(b => b.stage === 'negotiation').length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 mt-10">
                    <LayoutList className="w-8 h-8 opacity-20" />
                    <p className="text-xs text-center font-medium">Nenhuma negociação ativa.<br/>Dispare pitches para iniciar.</p>
                  </div>
                ) : (
                  buyers.filter(b => b.stage === 'negotiation').map(buyer => (
                    <div key={buyer.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 group hover:border-amber-300 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{buyer.name}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">{buyer.type} • {maskContact(buyer.phone)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => moveStage(buyer.id, 'closed')}
                          className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5"/> Marcar como Vendido
                        </button>
                        
                        <a 
                          href={`https://wa.me/55${buyer.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Falar no WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>

                        <button 
                          onClick={() => setHandlingObjectionFor(handlingObjectionFor === buyer.id ? null : buyer.id)}
                          className="px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Lidar com Objeção (IA)"
                        >
                          <MessageCircleQuestion className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => alert('Link de pagamento Stripe/MercadoPago copiado para a área de transferência: https://checkout.pay/lote-' + buyer.id)}
                          className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Gerar Link de Pagamento (Mock)"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      {handlingObjectionFor === buyer.id && (
                        <div className="mt-2 p-3 bg-amber-50/50 rounded-xl border border-amber-100 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Assistente de Objeções IA</p>
                          <textarea 
                            value={objectionText}
                            onChange={(e) => setObjectionText(e.target.value)}
                            placeholder="O que o cliente respondeu? Ex: Tá muito caro..."
                            className="w-full h-16 p-2 text-xs border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 focus:bg-white resize-none mb-2"
                          ></textarea>
                          {!objectionResponse ? (
                            <button 
                              onClick={() => handleGenerateObjectionResponse(buyer.name)}
                              disabled={!objectionText || isGeneratingResponse}
                              className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              {isGeneratingResponse ? <Sparkles className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              {isGeneratingResponse ? 'Analisando...' : 'Gerar Resposta'}
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-700 relative group">
                                {objectionResponse}
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(objectionResponse);
                                    alert('Copiado!');
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-indigo-50 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <span className="text-xs font-bold">Copiar</span>
                                </button>
                              </div>
                              <button 
                                onClick={() => {
                                  setObjectionResponse('');
                                  setObjectionText('');
                                  setHandlingObjectionFor(null);
                                }}
                                className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                              >
                                Fechar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna Fechados */}
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <DollarSign className="w-32 h-32" />
              </div>
              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span> Vendas Fechadas
                </h3>
                <span className="bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {buyers.filter(b => b.stage === 'closed').length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 relative z-10">
                {buyers.filter(b => b.stage === 'closed').length === 0 ? (
                  <p className="text-xs text-emerald-600/50 text-center mt-10 font-medium">Nenhuma venda fechada ainda.</p>
                ) : (
                  buyers.filter(b => b.stage === 'closed').map(buyer => (
                    <div key={buyer.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{buyer.name}</p>
                          <p className="text-xs font-bold text-slate-500 mt-1">{maskContact(buyer.phone)}</p>
                        </div>
                                                <div className="flex gap-2 items-center">
                          <button 
                            onClick={() => handleExportLeads(buyer.id)}
                            className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                            title="Baixar Leads (CSV)"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {buyers.filter(b => b.stage === 'closed').length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-200/50 flex justify-between items-center relative z-10">
                  <span className="text-xs font-bold text-emerald-700">Receita Total Estimada</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">
                    R$ {(buyers.filter(b => b.stage === 'closed').reduce((acc, b) => acc + ((b.purchasedBatch?.count || 10) * pricePerLead), 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

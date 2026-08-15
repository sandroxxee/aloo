import React, { useState } from 'react';
import { DollarSign, Coins, TrendingUp, Users, Building, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Calculator } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalLeadsCount: number;
}

export const SaaSMonetizationPlannerModal: React.FC<Props> = ({ isOpen, onClose, totalLeadsCount }) => {
  const [leadsPackPrice, setLeadsPackPrice] = useState<number>(250);
  const [packsSoldPerMonth, setPacksSoldPerMonth] = useState<number>(6);
  
  const [avgCommissionPerVehicle, setAvgCommissionPerVehicle] = useState<number>(3500);
  const [vehiclesBrokeredPerMonth, setVehiclesBrokeredPerMonth] = useState<number>(2);

  const [saasSubscriptionPrice, setSaasSubscriptionPrice] = useState<number>(199);
  const [saasUsersCount, setSaasUsersCount] = useState<number>(5);

  if (!isOpen) return null;

  const leadPacksIncome = packsSoldPerMonth * leadsPackPrice;
  const brokerageIncome = vehiclesBrokeredPerMonth * avgCommissionPerVehicle;
  const saasIncome = saasUsersCount * saasSubscriptionPrice;

  const totalMonthlyIncome = leadPacksIncome + brokerageIncome + saasIncome;
  const totalAnnualIncome = totalMonthlyIncome * 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base  text-slate-900 flex items-center gap-2">
                Simulador de Monetização & Faturamento
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  RENDA EXTRA / NEGÓCIO
                </span>
              </h3>
              
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Big Total Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Faturamento Mensal Estimado</span>
            <span className="text-emerald-400 font-bold text-sm bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
              100% Margem Líquida
            </span>
          </div>
          <div className="text-3xl font-display font-medium text-amber-400">
            R$ {totalMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-300">/ mês</span>
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-2 pt-1 border-t border-slate-800/80">
            <span>📅 Projeção Anual:</span>
            <strong className="text-emerald-400 font-bold">R$ {totalAnnualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* 3 Pillars of Revenue */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Ajuste Suas Metas Comerciais
          </h4>

          {/* Pillar 1: Brokerage */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">1. Corretagem de Caminhões & Peças</span>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                R$ {brokerageIncome.toLocaleString('pt-BR')}/mês
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Veículos Intermediados/Mês</label>
                <input
                  type="number"
                  min="0"
                  value={vehiclesBrokeredPerMonth}
                  onChange={(e) => setVehiclesBrokeredPerMonth(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Comissão Média por Veículo (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={avgCommissionPerVehicle}
                  onChange={(e) => setAvgCommissionPerVehicle(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pillar 2: Lead Pack Sales */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">2. Venda de Listas de Leads para Concessionárias</span>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                R$ {leadPacksIncome.toLocaleString('pt-BR')}/mês
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Pacotes Vendidos/Mês</label>
                <input
                  type="number"
                  min="0"
                  value={packsSoldPerMonth}
                  onChange={(e) => setPacksSoldPerMonth(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Preço do Pacote de 50 Leads (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={leadsPackPrice}
                  onChange={(e) => setLeadsPackPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pillar 3: SaaS Licenses */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">3. Assinaturas Recorrentes do Software (SaaS)</span>
              </div>
              <span className="text-xs font-bold text-amber-600">
                R$ {saasIncome.toLocaleString('pt-BR')}/mês
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Assinantes Ativos (Outros Corretores)</label>
                <input
                  type="number"
                  min="0"
                  value={saasUsersCount}
                  onChange={(e) => setSaasUsersCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Mensalidade cobrada (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={saasSubscriptionPrice}
                  onChange={(e) => setSaasSubscriptionPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tips Box */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Como Executar na Prática:</span>
          </div>
          <p className="text-sm text-emerald-800 leading-relaxed">
            Use o gerador de PDF de Venda de Leads (botão <strong>"Apresentação Comercial PDF"</strong>) para apresentar amostras cegas a concessionárias de caminhões em sua região. Ofereça os contatos mediante taxa única ou percentual em cada venda fechada.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Fechar Planejador
          </button>
        </div>
      </div>
    </div>
  );
};

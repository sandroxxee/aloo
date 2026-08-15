import React, { useState } from 'react';
import {  } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: string;
  initialPrice?: string;
  initialLocation?: string;
}

const BRAZIL_LOGISTICS_DISTANCES: Record<string, number> = {
  'SP-PR': 408,
  'SP-MG': 586,
  'SP-RJ': 430,
  'SP-SC': 705,
  'SP-RS': 1130,
  'SP-GO': 900,
  'SP-MT': 1550,
  'SP-MS': 1000,
  'SP-BA': 1960,
  'MG-PR': 990,
  'MG-GO': 720,
  'MG-RJ': 440,
  'PR-SC': 300,
  'PR-RS': 740,
  'GO-MT': 840,
  'PR-MS': 600,
};

export const FreightAndBrokerageCalculatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialItem = 'Volvo FH 540 / Scania R450',
  initialPrice = '380000',
  initialLocation = 'SP',
}) => {
  const [vehicleName, setVehicleName] = useState(initialItem);
  const [vehiclePrice, setVehiclePrice] = useState(initialPrice.replace(/\D/g, '') || '350000');
  const [originState, setOriginState] = useState(initialLocation.toUpperCase() || 'SP');
  const [destinationState, setDestinationState] = useState('PR');
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(0);
  const [freightRatePerKm, setFreightRatePerKm] = useState<number>(4.8); // R$ 4,80 por km rodado
  const [commissionPercent, setCommissionPercent] = useState<number>(3); // 3% comissão
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Estimate distance
  const key1 = `${originState}-${destinationState}`;
  const key2 = `${destinationState}-${originState}`;
  const defaultDist = BRAZIL_LOGISTICS_DISTANCES[key1] || BRAZIL_LOGISTICS_DISTANCES[key2] || 650;
  const distanceKm = customDistanceKm > 0 ? customDistanceKm : defaultDist;

  // Math
  const priceNum = parseFloat(vehiclePrice) || 0;
  const freightCost = distanceKm * freightRatePerKm;
  const commissionCost = (priceNum * commissionPercent) / 100;
  const totalCostWithDelivery = priceNum + freightCost;
  const netBrokerProfit = commissionCost;

  const summaryMessage = `*PROPOSTA COMERCIAL & CÁLCULO DE FRETE*
*Veículo / Item:* ${vehicleName}
*Valor do Veículo:* R$ ${priceNum.toLocaleString('pt-BR')}
*Trajeto:* ${originState} ➔ ${destinationState} (${distanceKm} km)
*Estimativa de Frete (R$ ${freightRatePerKm.toFixed(2)}/km):* R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
*Comissão de Intermediação (${commissionPercent}%):* R$ ${commissionCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
*Valor Total Final com Entrega:* R$ ${totalCostWithDelivery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

_Calculado via Asset Intelligence Enterprise_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statesList = ['SP', 'MG', 'PR', 'SC', 'RS', 'GO', 'MT', 'MS', 'RJ', 'BA', 'ES', 'PE', 'CE', 'PA'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900  flex items-center gap-2">
              Calculadora de Frete
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 ">
                GRATUITO
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Transporte, Comissões e Cotação Final</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modelo do Veículo / Peça</label>
              <input
                type="text"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="Ex: Volvo FH 540 6x2 / Scania R450"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preço do Anúncio (R$)</label>
              <input
                type="number"
                value={vehiclePrice}
                onChange={(e) => setVehiclePrice(e.target.value)}
                placeholder="350000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Route & Rates */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF Origem</label>
              <select
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
              >
                {statesList.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF Destino</label>
              <select
                value={destinationState}
                onChange={(e) => setDestinationState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
              >
                {statesList.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custo Frete/km (R$)</label>
              <input
                type="number"
                step="0.1"
                value={freightRatePerKm}
                onChange={(e) => setFreightRatePerKm(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Comissão (%)</label>
              <input
                type="number"
                step="0.5"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Calculation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
            <div className="text-xs font-bold text-blue-800">Distância Estimada</div>
            <div className="text-xl font-display font-medium text-blue-900">{distanceKm} km</div>
            <div className="text-xs text-blue-700 font-semibold">{originState} ➔ {destinationState}</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
            <div className="text-xs font-bold text-amber-800">Custo de Frete/Prancha</div>
            <div className="text-xl font-display font-medium text-amber-900">R$ {freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-amber-700 font-semibold">R$ {freightRatePerKm.toFixed(2)}/km</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
            <div className="text-xs font-bold text-emerald-800">Sua Comissão Líquida</div>
            <div className="text-xl font-display font-medium text-emerald-700">R$ {netBrokerProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-emerald-800 font-semibold">{commissionPercent}% de Intermediação</div>
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-xs font-bold text-slate-400">Preço Final do Veículo Entregue no Destino</div>
            <div className="text-2xl font-display font-medium text-amber-400">R$ {totalCostWithDelivery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="text-right text-sm text-slate-300">
            <div>Veículo: R$ {priceNum.toLocaleString('pt-BR')}</div>
            <div>Frete: R$ {freightCost.toLocaleString('pt-BR')}</div>
          </div>
        </div>

        {/* Generated WhatsApp Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
              Proposta Formatada
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-36 overflow-y-auto">
            {summaryMessage}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl cursor-pointer transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            Copiar Proposta
          </button>
        </div>
      </div>
    </div>
  );
};

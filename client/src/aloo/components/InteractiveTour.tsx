import React from 'react';

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (tab: any, subTab?: string) => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-xl max-w-sm shadow-xl space-y-2 text-xs">
      <h4 className="font-bold">Bem-vindo ao Asset Intelligence! 🚀</h4>
      <p className="text-slate-300">
        Use as abas para gerenciar contatos, pesquisar termos, enviar no WhatsApp e acompanhar estatísticas.
      </p>
      <button
        onClick={() => {
          localStorage.setItem('truck_miner_tour_completed', 'true');
          onClose();
        }}
        className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg"
      >
        Entendi
      </button>
    </div>
  );
};

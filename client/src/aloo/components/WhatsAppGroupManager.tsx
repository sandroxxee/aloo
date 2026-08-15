import React, { useState } from 'react';
import { Users, Plus, Copy, User, Send, Trash2 } from 'lucide-react';
import { WhatsAppGroup } from '../types';

interface WhatsAppGroupManagerProps {
  whatsappGroups: WhatsAppGroup[];
  onDeleteGroup: (id: string) => void;
  onAddGroup: (group: WhatsAppGroup) => void;
  onSetGroupBroadcastTemplate: (grp: WhatsAppGroup) => void;
}

export const WhatsAppGroupManager: React.FC<WhatsAppGroupManagerProps> = ({
  whatsappGroups,
  onDeleteGroup,
  onAddGroup,
  onSetGroupBroadcastTemplate
}) => {
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  
  // New Group States
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Compradores Frotas');
  const [newGroupInviteLink, setNewGroupInviteLink] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: WhatsAppGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName,
      category: newGroupCategory,
      inviteLink: newGroupInviteLink || 'https://chat.whatsapp.com/sample',
      description: newGroupDescription,
      memberCount: 0,
      createdDate: new Date().toLocaleDateString('pt-BR')
    };
    onAddGroup(newGroup);
    
    // Reset fields
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupInviteLink('');
    setShowNewGroupModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 border border-teal-200 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Grupos VIP & Comunidades de Campanha
              </h3>
              <p className="text-xs text-slate-500">
                Crie grupos temáticos no WhatsApp e envie convites automáticos para seus leads minerados entrarem na comunidade.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewGroupModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white  text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Grupo de Campanha</span>
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {whatsappGroups.map(grp => (
            <div key={grp.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-teal-700 font-bold bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200 font-mono">
                      {grp.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{grp.name}</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{grp.createdDate}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{grp.description}</p>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs text-slate-700">
                  <span className="truncate max-w-[240px] text-sm">{grp.inviteLink}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(grp.inviteLink);
                      alert('Link do grupo copiado!');
                    }}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                    title="Copiar Link"
                  >
                    <Copy className="w-3.5 h-3.5 text-teal-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>{grp.memberCount} Membros</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetGroupBroadcastTemplate(grp)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Convidar Leads</span>
                  </button>
                  <button
                    onClick={() => onDeleteGroup(grp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Excluir Grupo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: CRIAR NOVO GRUPO */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Criar Novo Grupo de Campanha / Comunidade VIP
              </h3>
              <button onClick={() => setShowNewGroupModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-mono cursor-pointer">✕ Fechar</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Nome do Grupo:</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: VIP - Ofertas & Repasse Scania / Volvo"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Categoria do Grupo:</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="Compradores Frotas">Compradores Frotas</option>
                  <option value="Venda de Peças">Venda de Peças</option>
                  <option value="Troca & Repasse">Troca & Repasse</option>
                  <option value="Parceria de Negócios">Parceria de Negócios</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Link de Convite do WhatsApp (Opcional):</label>
                <input
                  type="text"
                  value={newGroupInviteLink}
                  onChange={(e) => setNewGroupInviteLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Descrição do Grupo:</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Descreva o propósito do grupo para os convidados..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Grupo de Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

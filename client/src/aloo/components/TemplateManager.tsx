import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Tag, 
  MessageSquare,
  X,
  Save,
  Clock,
  Car,
  DollarSign
} from 'lucide-react';
import { useTemplateManager } from '../hooks/useTemplateManager';
import { MessageTemplate } from '../types';

export const TemplateManager: React.FC = () => {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useTemplateManager();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [formData, setFormData] = useState<Omit<MessageTemplate, 'id' | 'createdAt' | 'userId'>>({
    name: '',
    category: 'Universal / Neutro',
    text: '',
    mediaUrl: '',
    sendAsAudioTTS: false
  });

  const categories: MessageTemplate['category'][] = [
    'Universal / Neutro',
    'Venda de Peça',
    'Compra de Caminhão',
    'Troca / Repasse',
    'Parceria',
    'Oferta À Vista',
    'Divulgação / Sistema',
    'Consulta de Preço',
    'Detalhes do Veículo',
    'Follow-up'
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTemplate(editingId, formData);
        setEditingId(null);
      } else {
        await addTemplate(formData);
        setIsAdding(false);
      }
      setFormData({
        name: '',
        category: 'Universal / Neutro',
        text: '',
        mediaUrl: '',
        sendAsAudioTTS: false
      });
    } catch (err) {
      alert('Erro ao salvar template.');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      text: template.text,
      mediaUrl: template.mediaUrl || '',
      sendAsAudioTTS: template.sendAsAudioTTS || false
    });
    setEditingId(template.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Consulta de Preço': return <DollarSign className="w-3 h-3" />;
      case 'Detalhes do Veículo': return <Car className="w-3 h-3" />;
      case 'Follow-up': return <Clock className="w-3 h-3" />;
      default: return <Tag className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Gerenciador de Templates Zap
          </h2>
          <p className="text-xs text-slate-500">Salve e organize suas abordagens para converter mais leads.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Template
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar nos seus templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="All">Todas Categorias</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Editar Template' : 'Criar Novo Template'}
            </h3>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Template</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Abordagem Inicial Volvo"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem</label>
                <span className="text-[10px] text-slate-400">Suporta variáveis: {"{nome}, {item}, {preco}, {cidade}"}</span>
              </div>
              <textarea 
                required
                rows={5}
                value={formData.text}
                onChange={e => setFormData({...formData, text: e.target.value})}
                placeholder="Olá {nome}, vi seu anúncio do {item}..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.sendAsAudioTTS ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={formData.sendAsAudioTTS}
                      onChange={e => setFormData({...formData, sendAsAudioTTS: e.target.checked})}
                    />
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${formData.sendAsAudioTTS ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Enviar como Áudio (TTS)</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar Template
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map(template => (
            <div 
              key={template.id} 
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  {getCategoryIcon(template.category)}
                  {template.category}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(template)}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h4 className="font-bold text-slate-800 dark:text-white mb-2 truncate">{template.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 italic">
                "{template.text}"
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {template.sendAsAudioTTS && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      🎙️ Áudio
                    </span>
                  )}
                  {template.aiSuggested && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      ✨ IA
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(template.text);
                    // Add a brief "copied" state if possible
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copiar Texto
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Nenhum template encontrado</h3>
            <p className="text-xs text-slate-500 mb-6">Comece criando seu primeiro script de vendas.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Criar Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { WhatsAppGroup } from '../types';
import { INITIAL_GROUPS } from '../data/whatsappData';

export const useWhatsAppGroups = () => {
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>(() => {
    const saved = localStorage.getItem('truck_miner_whatsapp_groups');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_GROUPS;
  });

  useEffect(() => {
    localStorage.setItem('truck_miner_whatsapp_groups', JSON.stringify(whatsappGroups));
  }, [whatsappGroups]);

  const handleDeleteGroup = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      setWhatsappGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleAddGroup = (group: WhatsAppGroup) => {
    setWhatsappGroups(prev => [...prev, group]);
  };

  return {
    whatsappGroups,
    setWhatsappGroups,
    handleDeleteGroup,
    handleAddGroup
  };
};

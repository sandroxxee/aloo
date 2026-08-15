import { useState, useEffect, useCallback } from 'react';

export interface BotLog {
  id: string;
  time: string;
  phone: string;
  incoming: string;
  outgoing: string;
}

export const useWhatsAppBot = (onAddLog?: (log: any) => void) => {
  const [serverBotEnabled, setServerBotEnabled] = useState<boolean>(false);
  const [serverBotTone, setServerBotTone] = useState<'profissional' | 'amigável' | 'direto'>('amigável');
  const [serverBotInstructions, setServerBotInstructions] = useState<string>('Seja amigável, focado no setor de caminhões, frotas e autopeças no Brasil.');
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);

  const fetchBotConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/bot/config');
      if (res.ok) {
        const data = await res.json();
        setServerBotEnabled(data.enabled);
        setServerBotTone(data.tone || 'amigável');
        setServerBotInstructions(data.instructions || '');
      }
    } catch (e) {}
  }, []);

  const updateServerBotConfig = async (enabledVal: boolean, toneVal: string, instructionsVal: string) => {
    try {
      setServerBotEnabled(enabledVal);
      await fetch('/api/whatsapp/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enabledVal, tone: toneVal, instructions: instructionsVal })
      });
    } catch (err) {}
  };

  const fetchBotLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/bot/logs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) setBotLogs(data.logs);
      }
    } catch (e) {}
  }, []);

  const clearBotLogs = async () => {
    try {
      setBotLogs([]);
      await fetch('/api/whatsapp/bot/logs/clear', { method: 'POST' });
    } catch (e) {}
  };

  useEffect(() => {
    fetchBotConfig();
    fetchBotLogs();
    const interval = setInterval(fetchBotLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchBotConfig, fetchBotLogs]);

  return {
    serverBotEnabled,
    setServerBotEnabled,
    serverBotTone,
    setServerBotTone,
    serverBotInstructions,
    setServerBotInstructions,
    botLogs,
    updateServerBotConfig,
    clearBotLogs,
    fetchBotLogs
  };
};

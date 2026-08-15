import { useState, useEffect, useRef } from 'react';
import { useWhatsAppConfig } from './useWhatsAppConfig';

export const useWhatsAppEvolution = (onAddLog: (log: any) => void) => {
  const { gatewayConfig } = useWhatsAppConfig();
  
  const [isEvolutionConnected, setIsEvolutionConnected] = useState(false);
  const [showEvolutionQrModal, setShowEvolutionQrModal] = useState(false);
  const [evolutionQrBase64, setEvolutionQrBase64] = useState<string | null>(null);
  const [evolutionQrLoading, setEvolutionQrLoading] = useState(false);
  const [evolutionQrError, setEvolutionQrError] = useState<string | null>(null);

  const [latency, setLatency] = useState<number | null>(null);
  const [isInstable, setIsInstable] = useState(false);
  const [instances, setInstances] = useState<any[]>([]);

  const fetchInstances = async () => {
    const { apiUrl, apiKey } = gatewayConfig;
    if (!apiUrl || !apiKey) return;
    try {
      const query = new URLSearchParams({ apiUrl, apiKey });
      const res = await fetch(`/api/whatsapp/evolution/instance/fetchInstances?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInstances(data);
      }
    } catch (err) {}
  };

  const simulatePresence = async (presence: 'composing' | 'recording' | 'paused') => {
    const { apiUrl, apiKey, instanceId } = gatewayConfig;
    if (!apiUrl || !apiKey || !instanceId) return;
    try {
      await fetch(`/api/whatsapp/evolution/chat/presence/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          body: {
            presence,
            delay: 3000
          }
        })
      });
    } catch (err) {}
  };

  const logoutInstance = async () => {
    const { apiUrl, apiKey, instanceId } = gatewayConfig;
    if (!apiUrl || !apiKey || !instanceId) return;
    try {
      const query = new URLSearchParams({ apiUrl, apiKey });
      await fetch(`/api/whatsapp/evolution/instance/logout/${instanceId}?${query.toString()}`, { method: 'DELETE' });
      setIsEvolutionConnected(false);
      onAddLog({ level: 'warning', message: `🔌 Evolution API: Instância ${instanceId} desconectada.` });
    } catch (err) {}
  };

  const restartInstance = async () => {
    const { apiUrl, apiKey, instanceId } = gatewayConfig;
    if (!apiUrl || !apiKey || !instanceId) return;
    try {
      const query = new URLSearchParams({ apiUrl, apiKey });
      await fetch(`/api/whatsapp/evolution/instance/restart/${instanceId}?${query.toString()}`, { method: 'POST' });
      onAddLog({ level: 'success', message: `🔄 Evolution API: Instância ${instanceId} reiniciada.` });
    } catch (err) {}
  };

  const checkEvolutionHeartbeat = async () => {
    const { apiUrl, apiKey, instanceId, type } = gatewayConfig;
    if (type !== 'evolution' || !apiUrl || !apiKey || !instanceId) return;

    try {
      const query = new URLSearchParams({
        apiUrl,
        apiKey,
        instance: instanceId
      });
      const res = await fetch(`/api/whatsapp/evolution/instance/connectionState/${instanceId}?${query.toString()}`);
      const data = await res.json();
      
      if (data?.instance?.state) {
        setIsEvolutionConnected(data.instance.state === 'open');
        setLatency(100); 
        setIsInstable(false);
      } else {
        setIsEvolutionConnected(false);
        setIsInstable(true);
      }
    } catch (err) {
      setIsEvolutionConnected(false);
      setIsInstable(true);
      setLatency(null);
    }
  };

  const ensureEvolutionInstanceAndConnect = async () => {
    const { apiUrl, apiKey, instanceId } = gatewayConfig;
    if (!apiUrl || !apiKey || !instanceId) {
      onAddLog({
        id: `evo-err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: '⚠️ Evolution API: Configure a URL, Key e Instância antes de conectar.'
      });
      return;
    }

    setEvolutionQrLoading(true);
    setEvolutionQrError(null);
    setEvolutionQrBase64(null);
    setShowEvolutionQrModal(true);
    
    try {
      // 1. Create or Check instance via proxy
      await fetch(`/api/whatsapp/evolution/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          body: {
            instanceName: instanceId,
            token: apiKey,
            number: '',
            qrcode: true
          }
        })
      });
      
      // 2. Get QR Code via proxy
      const query = new URLSearchParams({ apiUrl, apiKey });
      const qrRes = await fetch(`/api/whatsapp/evolution/instance/connect/${instanceId}?${query.toString()}`);
      const qrData = await qrRes.json();
      
      if (qrData.base64) {
        setEvolutionQrBase64(qrData.base64);
      } else if (qrData.instance?.state === 'open') {
        setIsEvolutionConnected(true);
        setShowEvolutionQrModal(false);
        onAddLog({
          id: `evo-connect-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: '🚀 Evolution API: Instância já está conectada.'
        });
      } else {
        setEvolutionQrError('Não foi possível gerar o QR Code. Verifique se a instância já está conectada.');
      }
    } catch (err: any) {
      setEvolutionQrError(err.message || 'Erro ao conectar com Evolution API');
    } finally {
      setEvolutionQrLoading(false);
    }
  };

  useEffect(() => {
    checkEvolutionHeartbeat();
    const interval = setInterval(() => {
      checkEvolutionHeartbeat();
    }, 30000);
    return () => clearInterval(interval);
  }, [gatewayConfig.apiUrl, gatewayConfig.apiKey, gatewayConfig.instanceId, gatewayConfig.type]);

  return {
    isEvolutionConnected,
    showEvolutionQrModal, setShowEvolutionQrModal,
    evolutionQrBase64,
    evolutionQrLoading,
    evolutionQrError,
    ensureEvolutionInstanceAndConnect,
    latency,
    isInstable,
    instances,
    fetchInstances,
    simulatePresence,
    logoutInstance,
    restartInstance
  };
};

import { useState, useEffect } from 'react';

export const useWhatsAppConfig = () => {
  const [gatewayConfig, setGatewayConfig] = useState(() => {
    const saved = localStorage.getItem('truck_miner_gateway_config');
    let parsed: any = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {}
    }
    
    // Merge with individual legacy keys to preserve settings
    const legacyUrl = localStorage.getItem('truck_miner_evo_url');
    const legacyKey = localStorage.getItem('truck_miner_evo_key');
    const legacyInstance = localStorage.getItem('truck_miner_evo_instance');

    return {
      type: parsed.type || 'simulation',
      active: parsed.active !== undefined ? parsed.active : true,
      apiUrl: parsed.apiUrl || legacyUrl || 'https://api.evolution-api.com',
      apiKey: parsed.apiKey || legacyKey || '',
      instanceId: parsed.instanceId || legacyInstance || '',
      officialPhoneId: parsed.officialPhoneId || '',
      officialToken: parsed.officialToken || '',
      smsApiKey: parsed.smsApiKey || ''
    };
  });

  const [watchdogEnabled, setWatchdogEnabled] = useState(true);
  const [watchdogInterval, setWatchdogInterval] = useState(30000);
  const [isHealing, setIsHealing] = useState(false);

  const [emailApiKey, setEmailApiKey] = useState(() => localStorage.getItem('truck_miner_resend_key') || '');
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('truck_miner_eleven_key') || '');

  useEffect(() => {
    localStorage.setItem('truck_miner_gateway_config', JSON.stringify(gatewayConfig));
    localStorage.setItem('truck_miner_resend_key', emailApiKey);
    localStorage.setItem('truck_miner_eleven_key', elevenLabsKey);
    
    // Sync individual keys for backward compatibility with background services (lidResolver, sender)
    if (gatewayConfig.apiUrl) {
      localStorage.setItem('truck_miner_evo_url', gatewayConfig.apiUrl);
    }
    if (gatewayConfig.apiKey) {
      localStorage.setItem('truck_miner_evo_key', gatewayConfig.apiKey);
    }
    if (gatewayConfig.instanceId) {
      localStorage.setItem('truck_miner_evo_instance', gatewayConfig.instanceId);
    }
    
    // Sincroniza abas/instâncias se houver mudança externa no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'truck_miner_gateway_config' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setGatewayConfig(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [gatewayConfig, emailApiKey, elevenLabsKey]);

  return {
    gatewayConfig, setGatewayConfig,
    watchdogEnabled, setWatchdogEnabled,
    watchdogInterval, setWatchdogInterval,
    isHealing, setIsHealing,
    emailApiKey, setEmailApiKey,
    elevenLabsKey, setElevenLabsKey
  };
};

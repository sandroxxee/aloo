import { useState, useEffect } from 'react';

export const useWhatsAppSender = () => {
  const [broadcastMessageText, setBroadcastMessageText] = useState(() => localStorage.getItem('truck_miner_broadcast_text') || 'Olá {nome}, vi seu anúncio sobre {item} e gostaria de saber se ainda está disponível.');
  const [messageType, setMessageType] = useState(() => localStorage.getItem('truck_miner_msg_type') || 'text');
  const [usePTTStep2, setUsePTTStep2] = useState(() => localStorage.getItem('truck_miner_use_ptt') === 'true');
  const [includeButtons, setIncludeButtons] = useState(() => localStorage.getItem('truck_miner_include_btns') === 'true');
  const [mediaUrl, setMediaUrl] = useState(() => localStorage.getItem('truck_miner_media_url') || '');

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    localStorage.setItem('truck_miner_broadcast_text', broadcastMessageText);
    localStorage.setItem('truck_miner_msg_type', messageType);
    localStorage.setItem('truck_miner_use_ptt', String(usePTTStep2));
    localStorage.setItem('truck_miner_include_btns', String(includeButtons));
    localStorage.setItem('truck_miner_media_url', mediaUrl);
  }, [broadcastMessageText, messageType, usePTTStep2, includeButtons, mediaUrl]);

  return {
    broadcastMessageText, setBroadcastMessageText,
    messageType, setMessageType,
    usePTTStep2, setUsePTTStep2,
    includeButtons, setIncludeButtons,
    mediaUrl, setMediaUrl,
    isRunning, setIsRunning,
    isPaused, setIsPaused
  };
};

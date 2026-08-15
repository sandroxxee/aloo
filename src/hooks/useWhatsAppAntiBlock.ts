import { useState, useEffect } from 'react';

export const useWhatsAppAntiBlock = () => {
  const [smartJitter, setSmartJitter] = useState<boolean>(() => localStorage.getItem('truck_miner_smart_jitter') === 'true');
  const [minDelay, setMinDelay] = useState<number>(() => Number(localStorage.getItem('truck_miner_min_delay')) || 15);
  const [maxDelay, setMaxDelay] = useState<number>(() => Number(localStorage.getItem('truck_miner_max_delay')) || 45);
  const [delaySeconds, setDelaySeconds] = useState<number>(() => Number(localStorage.getItem('truck_miner_delay')) || 30);

  const [humanTypingSimulation, setHumanTypingSimulation] = useState<boolean>(() => localStorage.getItem('truck_miner_typing_sim') === 'true');
  const [typingDuration, setTypingDuration] = useState<number>(() => Number(localStorage.getItem('truck_miner_typing_duration')) || 4);

  const [restBreakEnabled, setRestBreakEnabled] = useState<boolean>(() => localStorage.getItem('truck_miner_rest_break_enabled') === 'true');
  const [restBreakAfterMsgs, setRestBreakAfterMsgs] = useState<number>(() => Number(localStorage.getItem('truck_miner_rest_after')) || 30);
  const [restBreakMinutes, setRestBreakMinutes] = useState<number>(() => Number(localStorage.getItem('truck_miner_rest_min')) || 10);

  const [spintaxSandboxText, setSpintaxSandboxText] = useState('{Olá|Oi|E aí}! Vi seu anúncio sobre {item}.');
  const [spintaxResult, setSpintaxResult] = useState('');

  const testSpintaxResult = () => {
    const processSpintax = (text: string) => {
      return text.replace(/\{([^{}]+)\}/g, (_, choiceStr) => {
        const choices = choiceStr.split('|');
        return choices[Math.floor(Math.random() * choices.length)];
      });
    };
    setSpintaxResult(processSpintax(spintaxSandboxText));
  };

  useEffect(() => {
    localStorage.setItem('truck_miner_smart_jitter', String(smartJitter));
    localStorage.setItem('truck_miner_min_delay', String(minDelay));
    localStorage.setItem('truck_miner_max_delay', String(maxDelay));
    localStorage.setItem('truck_miner_delay', String(delaySeconds));
    localStorage.setItem('truck_miner_typing_sim', String(humanTypingSimulation));
    localStorage.setItem('truck_miner_typing_duration', String(typingDuration));
    localStorage.setItem('truck_miner_rest_break_enabled', String(restBreakEnabled));
    localStorage.setItem('truck_miner_rest_after', String(restBreakAfterMsgs));
    localStorage.setItem('truck_miner_rest_min', String(restBreakMinutes));
  }, [smartJitter, minDelay, maxDelay, delaySeconds, humanTypingSimulation, typingDuration, restBreakEnabled, restBreakAfterMsgs, restBreakMinutes]);

  return {
    smartJitter, setSmartJitter,
    minDelay, setMinDelay,
    maxDelay, setMaxDelay,
    delaySeconds, setDelaySeconds,
    humanTypingSimulation, setHumanTypingSimulation,
    typingDuration, setTypingDuration,
    restBreakEnabled, setRestBreakEnabled,
    restBreakAfterMsgs, setRestBreakAfterMsgs,
    restBreakMinutes, setRestBreakMinutes,
    spintaxSandboxText, setSpintaxSandboxText,
    spintaxResult, testSpintaxResult
  };
};

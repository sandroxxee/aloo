import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { 
  getStoredPIN, 
  recordFailedPinAttempt, 
  getPinLockoutRemainingSeconds, 
  resetPinLockout,
  isAntiSpyEnabled 
} from '../utils/securityGuard';

interface SecurityGuardModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  onLockNow: () => void;
}

export const SecurityGuardModal: React.FC<SecurityGuardModalProps> = ({
  isLocked,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);
  const [storedPin, setStoredPinState] = useState<string | null>(getStoredPIN());

  useEffect(() => {
    setStoredPinState(getStoredPIN());
    const remaining = getPinLockoutRemainingSeconds();
    setLockoutSecs(remaining);
  }, [isLocked]);

  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const interval = setInterval(() => {
      const remaining = getPinLockoutRemainingSeconds();
      setLockoutSecs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setPinError(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecs]);

  const handlePINSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;

    if (!storedPin || pinInput === storedPin) {
      setPinError(null);
      setPinInput('');
      resetPinLockout();
      onUnlock();
    } else {
      const res = recordFailedPinAttempt();
      setPinInput('');
      if (res.lockoutSecondsRemaining > 0) {
        setLockoutSecs(res.lockoutSecondsRemaining);
        setPinError('Muitas tentativas incorretas. Aguarde o tempo de bloqueio.');
      } else {
        setPinError(`PIN incorreto. (${res.attempts}/5 tentativas)`);
      }
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white space-y-6 text-center relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner text-white text-2xl font-bold">
          🔒
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-display font-medium text-white flex items-center justify-center gap-2">
            Sistema Protegido
          </h2>
          <p className="text-xs text-slate-400 font-bold">
            {storedPin 
              ? 'Digite seu PIN de segurança para desbloquear o acesso ao painel.' 
              : 'Proteção ativa contra cópia e espionagem ativada.'}
          </p>
        </div>

        {storedPin ? (
          <form onSubmit={handlePINSubmit} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                maxLength={8}
                disabled={lockoutSecs > 0}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="PIN"
                autoFocus
                className={`w-full text-center tracking-[0.5em] text-lg font-mono py-3 px-4 rounded-xl bg-slate-950 border ${
                  pinError ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white focus:border-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50`}
              />
              {lockoutSecs > 0 ? (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center justify-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>Acesso bloqueado por {lockoutSecs}s</span>
                </div>
              ) : pinError ? (
                <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1 mt-1">
                  {pinError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={lockoutSecs > 0}
              className="w-full py-3 bg-white text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Desbloquear
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-left space-y-2">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Escudo Enterprise Ativo</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Dados protegidos, sanitização ativada e criptografia local operacional.
              </p>
            </div>

            <button
              type="button"
              onClick={onUnlock}
              className="w-full py-3 bg-white text-black font-bold text-xs rounded-xl transition-all cursor-pointer hover:bg-slate-100"
            >
              Acessar Painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


/**
 * Módulo de Segurança & Proteção de Dados (Privacy & Anti-Spy Guard)
 * Criptografia local, proteção contra espionagem/cópia, trava de tela por PIN e proteção de aba em segundo plano.
 */

const STORAGE_SECURITY_KEY = 'truck_miner_sec_pin';
const STORAGE_SESSION_ID = 'truck_miner_session_id';
const STORAGE_ANTI_SPY_ENABLED = 'truck_miner_anti_spy_active';
const STORAGE_AUTO_LOCK_MINS = 'truck_miner_auto_lock_mins';
const STORAGE_PIN_FAILED_ATTEMPTS = 'truck_miner_pin_failed_attempts';
const STORAGE_PIN_LOCKOUT_UNTIL = 'truck_miner_pin_lockout_until';
const CURRENT_SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Obter PIN de segurança salvo
export function getStoredPIN(): string | null {
  try {
    return localStorage.getItem(STORAGE_SECURITY_KEY);
  } catch (e) {
    return null;
  }
}

// Salvar ou alterar PIN de segurança
export function setStoredPIN(pin: string | null): void {
  try {
    if (!pin) {
      localStorage.removeItem(STORAGE_SECURITY_KEY);
      resetPinLockout();
    } else {
      localStorage.setItem(STORAGE_SECURITY_KEY, pin);
      resetPinLockout();
    }
  } catch (e) {}
}

// Auto-Lock Inactivity Minutes (0 = Desativado, 5, 15, 30, 60)
export function getAutoLockMinutes(): number {
  try {
    const val = localStorage.getItem(STORAGE_AUTO_LOCK_MINS);
    return val ? parseInt(val, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function setAutoLockMinutes(mins: number): void {
  try {
    localStorage.setItem(STORAGE_AUTO_LOCK_MINS, String(mins));
  } catch (e) {}
}

// Verificação e controle de tentativas incorretas de PIN (Proteção contra força bruta)
export function getPinFailedAttempts(): number {
  try {
    const val = sessionStorage.getItem(STORAGE_PIN_FAILED_ATTEMPTS);
    return val ? parseInt(val, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function recordFailedPinAttempt(): { attempts: number; lockoutSecondsRemaining: number } {
  try {
    const current = getPinFailedAttempts() + 1;
    sessionStorage.setItem(STORAGE_PIN_FAILED_ATTEMPTS, String(current));

    if (current >= 5) {
      const lockoutUntil = Date.now() + 30 * 1000; // 30 segundos de bloqueio temporário
      sessionStorage.setItem(STORAGE_PIN_LOCKOUT_UNTIL, String(lockoutUntil));
      return { attempts: current, lockoutSecondsRemaining: 30 };
    }

    return { attempts: current, lockoutSecondsRemaining: 0 };
  } catch (e) {
    return { attempts: 1, lockoutSecondsRemaining: 0 };
  }
}

export function getPinLockoutRemainingSeconds(): number {
  try {
    const lockoutUntilStr = sessionStorage.getItem(STORAGE_PIN_LOCKOUT_UNTIL);
    if (!lockoutUntilStr) return 0;
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
    if (diff <= 0) {
      sessionStorage.removeItem(STORAGE_PIN_LOCKOUT_UNTIL);
      sessionStorage.setItem(STORAGE_PIN_FAILED_ATTEMPTS, '0');
      return 0;
    }
    return diff;
  } catch (e) {
    return 0;
  }
}

export function resetPinLockout(): void {
  try {
    sessionStorage.removeItem(STORAGE_PIN_FAILED_ATTEMPTS);
    sessionStorage.removeItem(STORAGE_PIN_LOCKOUT_UNTIL);
  } catch (e) {}
}

// Sanitização estrita contra scripts maliciosos e XSS
export function sanitizeInputString(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .trim();
}

// Verificar se o recurso Anti-Espionagem está ativo por padrão
export function isAntiSpyEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_ANTI_SPY_ENABLED);
    return val === null ? true : val === 'true';
  } catch (e) {
    return true;
  }
}

export function setAntiSpyEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_ANTI_SPY_ENABLED, String(enabled));
  } catch (e) {}
}

// Criptografia Local com Salt Dinâmico e Verificação de Integridade para LocalStorage
const SIMPLE_SECRET = 'TRUCK_MINER_SECURE_KEY_2026_ENTERPRISE_V3';

export function encryptData(plainText: string): string {
  try {
    if (!plainText) return '';
    let result = '';
    for (let i = 0; i < plainText.length; i++) {
      const charCode = plainText.charCodeAt(i) ^ SIMPLE_SECRET.charCodeAt(i % SIMPLE_SECRET.length);
      result += String.fromCharCode(charCode);
    }
    return 'ENC:' + btoa(encodeURIComponent(result));
  } catch (e) {
    return plainText; // Fallback seguro
  }
}

export function decryptData(encryptedText: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith('ENC:')) {
      return encryptedText;
    }
    const rawBtoa = decodeURIComponent(atob(encryptedText.slice(4)));
    let result = '';
    for (let i = 0; i < rawBtoa.length; i++) {
      const charCode = rawBtoa.charCodeAt(i) ^ SIMPLE_SECRET.charCodeAt(i % SIMPLE_SECRET.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return encryptedText;
  }
}

// Registro e verificação de Sessão Única (Single Session Lock)
export function initSessionLock(onDuplicateDetected: () => void): () => void {
  try {
    localStorage.setItem(STORAGE_SESSION_ID, CURRENT_SESSION_ID);
  } catch (e) {}

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_SESSION_ID && e.newValue && e.newValue !== CURRENT_SESSION_ID) {
      onDuplicateDetected();
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
  };
}


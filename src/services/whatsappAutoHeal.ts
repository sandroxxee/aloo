import { connectionStatus, connectToWhatsApp, logWhatsapp, sock } from './whatsapp';
import fs from 'fs';
import path from 'path';

let autoHealInterval: NodeJS.Timeout | null = null;
let criticalErrorStartTime: number | null = null;
const CRITICAL_ERROR_THRESHOLD_MS = 5000; // 5 segundos

/**
 * Monitor de Auto-Heal para WhatsApp.
 * Verifica a estabilidade do websocket e reinicia a conexão apenas se o estado for de erro crítico por mais de 5 segundos.
 */
export function startWhatsAppAutoHeal() {
  if (autoHealInterval) return;

  logWhatsapp('🩹 [Auto-Heal] Iniciando monitor de estabilidade inteligente (5s threshold)...');

  autoHealInterval = setInterval(async () => {
    // ESTADO CRÍTICO: 
    // 1. Status 'close' ou 'refused' (quando não deveria estar)
    // 2. Status 'open' mas websocket em readyState !== 1 (OPEN)
    
    let isCurrentlyCritical = false;
    const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info_baileys', 'creds.json'));
    
    if (hasSession) {
      if (connectionStatus === 'close' || connectionStatus === 'refused') {
        isCurrentlyCritical = true;
      } else if (connectionStatus === 'open') {
        // Se está 'open' mas o websocket subjacente não está pronto
        if (sock && sock.ws && sock.ws.readyState !== 1) {
          isCurrentlyCritical = true;
        }
      }
    }

    if (isCurrentlyCritical) {
      if (!criticalErrorStartTime) {
        criticalErrorStartTime = Date.now();
      } else {
        const duration = Date.now() - criticalErrorStartTime;
        
        if (duration >= CRITICAL_ERROR_THRESHOLD_MS) {
          logWhatsapp(`🚨 [Auto-Heal] Instabilidade crítica persistente por ${Math.round(duration/1000)}s. Acionando recuperação...`);
          
          criticalErrorStartTime = null; 
          
          try {
            // Se o status era open mas o ws estava quebrado, forçamos fechamento
            if (connectionStatus === 'open' && sock && sock.ws) {
              try { sock.ws.close(); } catch (e) {}
            }
            
            await connectToWhatsApp();
          } catch (err) {
            logWhatsapp('❌ [Auto-Heal] Falha na tentativa de recuperação automática.');
          }
        }
      }
    } else {
      // Reset se voltou ao normal
      if (criticalErrorStartTime) {
        criticalErrorStartTime = null;
      }
    }
  }, 1000); // Verifica a cada segundo para precisão do threshold de 5s
}

export function stopWhatsAppAutoHeal() {
  if (autoHealInterval) {
    clearInterval(autoHealInterval);
    autoHealInterval = null;
    criticalErrorStartTime = null;
    logWhatsapp('🩹 [Auto-Heal] Monitor de estabilidade desativado.');
  }
}

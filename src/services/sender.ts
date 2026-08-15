import { resolveLidNumber } from './lidResolver';

interface SendHumanOptions {
  phone: string;
  message: string;
  onLog?: (msg: string) => void;
}

/**
 * Envia mensagem simulando comportamento humano:
 * 1. Resolve LID / JID
 * 2. Envia presença "composing" por 4 segundos
 * 3. Delay humano aleatório (1-3s)
 * 4. Dispara sendText na Evolution API
 */
export async function enviarComHumano({ phone, message, onLog }: SendHumanOptions): Promise<{ success: boolean; error?: string }> {
  const log = (text: string) => {
    if (onLog) onLog(text);
    console.log(`[Sender Humanóide] ${text}`);
  };

  try {
    log(`Iniciando envio humanizado para ${phone}...`);

    // 1. Resolver LID / JID
    const resolved = await resolveLidNumber(phone);
    if (!resolved.exists) {
      return { success: false, error: 'Número não possui WhatsApp ativo (verificado via LID)' };
    }

    const targetJid = resolved.jid || resolved.lid || `${phone}@s.whatsapp.net`;
    log(`Destino resolvido: ${targetJid}`);

    const evoUrl = localStorage.getItem('truck_miner_evo_url') || 'https://evolution-api-production-c508.up.railway.app';
    const evoKey = localStorage.getItem('truck_miner_evo_key') || '9f8d7e6c5b4a3921f0e8d7c6b5a4f3e2d1';
    const instanceName = localStorage.getItem('truck_miner_evo_instance') || 'zap';

    // 2. Enviar presença "composing" (digitando...)
    log('Simulando presença: digitando...');
    try {
      await fetch('/api/whatsapp/evolution/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiUrl: evoUrl,
          apiKey: evoKey,
          path: `/chat/sendPresence/${instanceName}`,
          method: 'POST',
          body: {
            number: targetJid,
            presence: 'composing',
            delay: 4000
          }
        })
      });
    } catch (e) {
      // Presença opcional, não bloqueia o fluxo se falhar
    }

    // 3. Aguardar 4 segundos de digitação + delay humano aleatório (1000ms a 3000ms)
    const humanDelay = 4000 + Math.floor(Math.random() * 2000);
    await new Promise(resolve => setTimeout(resolve, humanDelay));

    // 4. Enviar texto efetivo
    log('Disparando mensagem de texto...');
    const res = await fetch('/api/whatsapp/evolution/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiUrl: evoUrl,
        apiKey: evoKey,
        path: `/message/sendText/${instanceName}`,
        method: 'POST',
        body: {
          number: targetJid,
          textMessage: {
            text: message
          },
          options: {
            delay: 1200,
            presence: 'composing'
          }
        }
      })
    });

    if (res.ok) {
      log('Mensagem entregue com sucesso!');
      return { success: true };
    } else {
      const errText = await res.text().catch(() => '');
      if (res.status === 429) {
        return { success: false, error: 'Rate limit 429 excedido (Muitas requisições)' };
      }
      return { success: false, error: `Evolution API HTTP ${res.status}: ${errText.substring(0, 100)}` };
    }

  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão no envio humanizado' };
  }
}

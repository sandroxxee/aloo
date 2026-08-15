import { maskContact } from './textProcessor';
import { Lead } from '../types';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    alert('Seu navegador não suporta a API de Notificações do Sistema.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificação:', err);
    return 'denied';
  }
};

export const sendHighValueLeadNotification = (
  lead: Lead,
  onNotificationClick?: (lead: Lead) => void
): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const isHighIntent = lead.intent === 'Compra';
    const score = lead.aiQualificationScore || 0;
    const badgeText = isHighIntent ? '🎯 Intenção de Compra Direta' : `⭐ Score de IA: ${score}/100`;

    const title = `🚨 LEAD DE ALTO VALOR: ${lead.name || lead.sellerFullName || 'Novo Contato'}`;
    const body = `${badgeText}\n🚛 ${lead.item || 'Anúncio de Caminhão/Peça'}\n💰 ${lead.price || 'Preço sob consulta'} • 📍 ${lead.location || lead.city || 'Brasil'}\n📲 WhatsApp: ${maskContact(lead.phone)}`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `high_val_lead_${lead.id}_${Date.now()}`,
      requireInteraction: true, // Permanece visível na tela até ação do operador
      silent: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (e) {}
      if (onNotificationClick) {
        onNotificationClick(lead);
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Falha ao enviar Notificação no Navegador:', err);
    return false;
  }
};

export const sendTestBrowserNotification = (onNotificationClick?: () => void): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const title = `🔔 Asset Intel - Notificações Ativas!`;
    const body = `O sistema alertará automaticamente nesta área quando um lead de ALTO VALOR for encontrado no loop autônomo em background.`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `test_notification_${Date.now()}`,
      silent: false,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (e) {}
      if (onNotificationClick) {
        onNotificationClick();
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Erro ao enviar notificação de teste:', err);
    return false;
  }
};

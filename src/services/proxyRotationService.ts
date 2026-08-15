import { HttpsProxyAgent } from 'https-proxy-agent';

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https';
}

class ProxyRotationService {
  private proxies: string[] = [];
  private currentIndex: number = 0;
  private enabled: boolean = false;

  constructor() {
    this.loadFromEnv();
  }

  private loadFromEnv() {
    const proxyList = process.env.PROXY_LIST; // Format: host:port,user:pass@host:port
    if (proxyList) {
      this.proxies = proxyList.split(',').map(p => p.trim()).filter(Boolean);
      this.enabled = this.proxies.length > 0;
      console.log(`[ProxyService] Carregados ${this.proxies.length} proxies da variável de ambiente.`);
    }

    const proxyEnabled = process.env.PROXY_ENABLED === 'true';
    if (proxyEnabled && this.proxies.length > 0) {
      this.enabled = true;
    }
  }

  public getNextProxyAgent(): HttpsProxyAgent<string> | null {
    if (!this.enabled || this.proxies.length === 0) return null;

    const proxyUrl = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

    try {
      // Ensure protocol
      const fullUrl = proxyUrl.startsWith('http') ? proxyUrl : `http://${proxyUrl}`;
      return new HttpsProxyAgent(fullUrl);
    } catch (error) {
      console.error(`[ProxyService] Erro ao criar agente para o proxy ${proxyUrl}:`, error);
      return null;
    }
  }

  public getProxyStatus() {
    return {
      enabled: this.enabled,
      count: this.proxies.length,
      currentIndex: this.currentIndex
    };
  }

  public setProxies(proxyList: string[]) {
    this.proxies = proxyList;
    this.enabled = this.proxies.length > 0;
    this.currentIndex = 0;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const proxyRotationService = new ProxyRotationService();

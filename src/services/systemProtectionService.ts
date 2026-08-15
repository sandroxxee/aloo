import { Lead } from '../types';

/**
 * System Protection & Backup Service V3.5
 * Protege contra perda de dados e configurações
 */
export interface SystemSnapshot {
  version: string;
  timestamp: string;
  config: {
    extractionRules: any;
    webhooks: any;
    prompts: any;
    keywords: string[];
  };
  leads: Lead[];
}

export function createSystemSnapshot(leads: Lead[], config: any): SystemSnapshot {
  return {
    version: '3.5.0-PROTECTED',
    timestamp: new Date().toISOString(),
    config: config,
    leads: leads
  };
}

export function downloadSnapshot(snapshot: SystemSnapshot) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `ASSET_INTEL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

import LZString from 'lz-string';
import { Lead } from '../types';
import { sqliteSaveLeads, sqliteLoadLeads } from '../services/sqliteLeads';
import { showToastNotification } from '../components/Toast';
import { updateWarmedLeadsCache } from './cacheWarmupEngine';

const STORAGE_KEY_BACKUP = 'truck_miner_leads_backup';
const STORAGE_KEY_LEADS = 'truck_miner_leads';
const STORAGE_KEY_LEADS_COMPRESSED = 'truck_miner_leads_compressed';
const STORAGE_KEY_AUTO_BACKUPS = 'truck_miner_auto_backups_history';
const STORAGE_KEY_LAST_CHECKPOINT = 'truck_miner_last_checkpoint_count';

export interface AutoBackupSnapshot {
  id: string;
  timestamp: string;
  count: number;
  compressedData: string;
}

export interface AutoBackupSnapshotDecoded {
  id: string;
  timestamp: string;
  count: number;
  data: Lead[];
}

export const saveBackup = (leads: Lead[]): void => {
  try {
    const json = JSON.stringify(leads);
    const compressed = LZString.compressToUTF16(json);
    localStorage.setItem(STORAGE_KEY_BACKUP, compressed);
    console.log(`Backup saved successfully. Size reduced from ${json.length} to ${compressed.length} characters.`);
    showToastNotification(`Backup gerado com sucesso! (${leads.length} leads salvos)`, 'success');
  } catch (error) {
    console.error('Failed to save backup:', error);
    showToastNotification('Erro ao gerar backup de segurança.', 'error');
  }
};

export const restoreBackup = (): Lead[] | null => {
  try {
    const compressed = localStorage.getItem(STORAGE_KEY_BACKUP);
    if (!compressed) return null;
    const json = LZString.decompressFromUTF16(compressed);
    if (!json) return null;
    return JSON.parse(json) as Lead[];
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return null;
  }
};

/**
 * Checks if a new 100-contact checkpoint has been reached and creates an automatic backup snapshot.
 */
export const checkAndCreateAutoBackup = (
  leadsList: Lead[],
  onCheckpointReached?: (count: number, snapshot: AutoBackupSnapshot) => void
): void => {
  try {
    const currentCount = leadsList.length;
    const lastCheckpointStr = localStorage.getItem(STORAGE_KEY_LAST_CHECKPOINT) || '0';
    const lastCheckpoint = parseInt(lastCheckpointStr, 10) || 0;

    // Check if we crossed a 100-contact threshold (e.g. 100, 200, 300...)
    const currentTier = Math.floor(currentCount / 100);
    const lastTier = Math.floor(lastCheckpoint / 100);

    if (currentTier > lastTier && currentTier > 0) {
      const milestone = currentTier * 100;
      localStorage.setItem(STORAGE_KEY_LAST_CHECKPOINT, milestone.toString());

      const jsonStr = JSON.stringify(leadsList);
      const compressedData = LZString.compressToUTF16(jsonStr);

      const snapshot: AutoBackupSnapshot = {
        id: `auto_backup_${milestone}_${Date.now()}`,
        timestamp: new Date().toLocaleString('pt-BR'),
        count: currentCount,
        compressedData,
      };

      // Save to history list (keep up to 2 recent auto backups to avoid quota issues)
      const existingHistoryStr = localStorage.getItem(STORAGE_KEY_AUTO_BACKUPS);
      let history: AutoBackupSnapshot[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      history = [snapshot, ...history].slice(0, 2);
      localStorage.setItem(STORAGE_KEY_AUTO_BACKUPS, JSON.stringify(history));

      // Also trigger primary backup
      saveBackup(leadsList);

      if (onCheckpointReached) {
        onCheckpointReached(milestone, snapshot);
      }
    }
  } catch (err) {
    console.error('Error in checkAndCreateAutoBackup:', err);
  }
};

export const getAutoBackupsHistory = (): AutoBackupSnapshot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTO_BACKUPS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load auto backups history:', err);
    return [];
  }
};

export const decodeAutoBackupSnapshot = (snapshot: AutoBackupSnapshot): Lead[] => {
  try {
    if (!snapshot.compressedData) return [];
    const json = LZString.decompressFromUTF16(snapshot.compressedData);
    if (!json) return [];
    return JSON.parse(json) as Lead[];
  } catch (err) {
    console.error('Failed to decode auto backup snapshot:', err);
    return [];
  }
};

/**
 * Safely saves leads to SQLite (relational storage).
 * Falls back to localStorage if SQLite is not available, 
 * although SQLite is now the primary high-capacity storage.
 */
export const safeSaveLeads = (leadsList: Lead[]): void => {
  // Atualiza instantaneamente o cache aquecido dos primeiros 50 metadados essenciais no localStorage
  updateWarmedLeadsCache(leadsList);

  try {
    // Primary storage: SQLite (supported 5000+ leads without performance blocking)
    sqliteSaveLeads(leadsList).catch(err => {
      console.warn('SQLite save failed, falling back to legacy localStorage logic:', err);
      legacySaveLeads(leadsList);
    });
  } catch (e) {
    console.warn('SQLite save call failed immediately:', e);
    legacySaveLeads(leadsList);
  }
};

/**
 * Legacy save logic for localStorage (retained as fallback or for small metadata)
 */
const legacySaveLeads = (leadsList: Lead[]): void => {
  try {
    // 1. Try raw JSON first if the list is reasonably small
    const json = JSON.stringify(leadsList);
    if (json.length < 2500000) {
      localStorage.removeItem(STORAGE_KEY_LEADS_COMPRESSED);
      localStorage.setItem(STORAGE_KEY_LEADS, json);
      return;
    }
    // ... remaining legacy logic truncated for brevity as we prioritize SQLite
    const compressed = LZString.compressToUTF16(json);
    localStorage.removeItem(STORAGE_KEY_LEADS);
    localStorage.setItem(STORAGE_KEY_LEADS_COMPRESSED, compressed);
  } catch (e) {
    console.error('Legacy save failed:', e);
  }
};

/**
 * Safely loads leads from SQLite (Primary) or localStorage (Fallback).
 */
export const safeLoadLeads = async (): Promise<Lead[]> => {
  try {
    // 1. Try SQLite first (High performance)
    const sqlLeads = await sqliteLoadLeads();
    if (sqlLeads && sqlLeads.length > 0) {
      console.log(`🤖 SQLite: Loaded ${sqlLeads.length} leads from local relational storage.`);
      return sqlLeads;
    }

    // 2. Fallback to raw localStorage
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    if (raw) return JSON.parse(raw);

    // 3. Fallback to compressed localStorage
    const compressed = localStorage.getItem(STORAGE_KEY_LEADS_COMPRESSED);
    if (compressed) {
      const decompressed = LZString.decompressFromUTF16(compressed);
      if (decompressed) return JSON.parse(decompressed);
    }

    // 4. Fallback to backup
    const backup = restoreBackup();
    if (backup && backup.length > 0) return backup;
  } catch (e) {
    console.error('Error in safeLoadLeads (async):', e);
  }
  return [];
};

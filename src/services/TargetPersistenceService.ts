import { WatchlistTarget } from '../types';
import { mockWatchlist } from '../mockData';

export const WATCHLIST_STORAGE_KEY = 'synthetic_watchlist_targets';
export const DRAFT_IMAGE_STORAGE_KEY = 'synthetic_watchlist_draft_image';
export const DRAFT_FORM_STORAGE_KEY = 'synthetic_watchlist_draft_form';

export interface ITargetPersistence {
  saveTarget(target: WatchlistTarget): WatchlistTarget;
  getTarget(id: string): WatchlistTarget | null;
  listTargets(): WatchlistTarget[];
  updateTarget(id: string, updates: Partial<WatchlistTarget>): WatchlistTarget | null;
  deleteTarget(id: string): boolean;
  clearDemoTargets(): void;
  resetToDemoDefaults(): WatchlistTarget[];
  saveDraftImage(imageDataUrl: string | null): void;
  getDraftImage(): string | null;
  saveDraftForm(formData: { name: string; attire: string; plate: string; threatLevel: 'high' | 'medium' | 'critical' }): void;
  getDraftForm(): { name: string; attire: string; plate: string; threatLevel: 'high' | 'medium' | 'critical' } | null;
}

/**
 * In-memory fallback for environments where window.localStorage is unavailable (e.g. Node CLI testing)
 */
class MemoryStorage {
  private store = new Map<string, string>();
  
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  
  removeItem(key: string): void {
    this.store.delete(key);
  }
  
  clear(): void {
    this.store.clear();
  }
}

const memoryStorageFallback = new MemoryStorage();

function getStorage(): Storage | MemoryStorage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return memoryStorageFallback;
}

/**
 * Compresses an image data URL or File to a compact JPEG representation for localStorage storage.
 * Enforces a maximum resolution (default 300x300) and JPEG quality.
 */
export async function compressImage(
  source: string | File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  // If in Node or non-browser environment where Image/Canvas is not defined:
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (typeof source === 'string') return source;
    return 'data:image/jpeg;base64,demoPlaceholderCompressed';
  }

  return new Promise((resolve, reject) => {
    const processDataUrl = (dataUrl: string) => {
      // If it's an external HTTP/HTTPS URL or SVG, don't re-compress with canvas
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          // If canvas fails (e.g. cross-origin taint), resolve with original
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processDataUrl(result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(new Error('File reader error'));
      reader.readAsDataURL(source);
    }
  });
}

export class TargetPersistenceService implements ITargetPersistence {
  private storageKey: string;
  public storageQuotaExceeded = false;

  constructor(storageKey = WATCHLIST_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Retrieves all persisted synthetic targets from storage.
   * If storage has never been initialized, seeds it deterministically from mockWatchlist.
   * Normal navigation calls listTargets(), which preserves user edits.
   */
  listTargets(): WatchlistTarget[] {
    const storage = getStorage();
    try {
      const raw = storage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[TargetPersistenceService] Failed to read targets from storage, falling back to seed data', e);
    }

    // Initialize with seed data on first run
    const initialSeed = this.getInitialSeedData();
    this.saveAllTargets(initialSeed);
    return initialSeed;
  }

  /**
   * Returns deterministic seed targets from mockWatchlist.
   */
  getInitialSeedData(): WatchlistTarget[] {
    return JSON.parse(JSON.stringify(mockWatchlist)).map((t: WatchlistTarget) => ({
      ...t,
      createdAt: t.dateAdded || new Date().toISOString(),
      updatedAt: t.dateAdded || new Date().toISOString(),
      syncStatus: 'SYNCHRONIZED',
      alias: t.name,
      vehiclePlate: t.associatedPlate,
      attire: t.lastKnownAttire,
      severity: t.threatLevel
    }));
  }

  /**
   * Retrieves a single target by id.
   */
  getTarget(id: string): WatchlistTarget | null {
    const targets = this.listTargets();
    return targets.find(t => t.id === id) || null;
  }

  /**
   * Saves a new target to storage, preventing duplicate IDs.
   */
  saveTarget(target: WatchlistTarget): WatchlistTarget {
    const targets = this.listTargets();
    const existingIndex = targets.findIndex(t => t.id === target.id);
    
    const enrichedTarget: WatchlistTarget = {
      ...target,
      createdAt: target.dateAdded || target.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: target.syncStatus || 'SYNCHRONIZED',
      alias: target.alias || target.name || 'Unknown Suspect',
      vehiclePlate: target.vehiclePlate || target.associatedPlate,
      attire: target.attire || target.lastKnownAttire,
      severity: target.severity || target.threatLevel || 'high'
    };

    if (existingIndex >= 0) {
      targets[existingIndex] = enrichedTarget;
    } else {
      targets.unshift(enrichedTarget);
    }

    this.saveAllTargets(targets);
    return enrichedTarget;
  }

  /**
   * Updates an existing target by id.
   */
  updateTarget(id: string, updates: Partial<WatchlistTarget>): WatchlistTarget | null {
    const targets = this.listTargets();
    const index = targets.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = targets[index];
    const updated: WatchlistTarget = {
      ...existing,
      ...updates,
      id: existing.id, // ID remains immutable
      updatedAt: new Date().toISOString()
    };

    targets[index] = updated;
    this.saveAllTargets(targets);
    return updated;
  }

  /**
   * Deletes a target by id.
   */
  deleteTarget(id: string): boolean {
    const targets = this.listTargets();
    const filtered = targets.filter(t => t.id !== id);
    if (filtered.length === targets.length) return false;

    this.saveAllTargets(filtered);
    return true;
  }

  /**
   * Clears all stored targets and resets storage to initial demo defaults.
   */
  resetToDemoDefaults(): WatchlistTarget[] {
    const seed = this.getInitialSeedData();
    this.saveAllTargets(seed);
    this.saveDraftImage(null);
    this.saveDraftForm({ name: '', attire: '', plate: '', threatLevel: 'high' });
    this.storageQuotaExceeded = false;
    return seed;
  }

  /**
   * Alias for resetToDemoDefaults
   */
  clearDemoTargets(): void {
    this.resetToDemoDefaults();
  }

  /**
   * Saves or clears the unsubmitted draft image in the registration panel.
   */
  saveDraftImage(imageDataUrl: string | null): void {
    const storage = getStorage();
    try {
      if (imageDataUrl) {
        storage.setItem(DRAFT_IMAGE_STORAGE_KEY, imageDataUrl);
      } else {
        storage.removeItem(DRAFT_IMAGE_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[TargetPersistenceService] Could not persist draft image', e);
    }
  }

  /**
   * Gets the unsubmitted draft image from storage.
   */
  getDraftImage(): string | null {
    const storage = getStorage();
    try {
      return storage.getItem(DRAFT_IMAGE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Saves unsubmitted draft form inputs.
   */
  saveDraftForm(formData: { name: string; attire: string; plate: string; threatLevel: 'high' | 'medium' | 'critical' }): void {
    const storage = getStorage();
    try {
      storage.setItem(DRAFT_FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn('[TargetPersistenceService] Could not persist draft form', e);
    }
  }

  /**
   * Gets unsubmitted draft form inputs from storage.
   */
  getDraftForm(): { name: string; attire: string; plate: string; threatLevel: 'high' | 'medium' | 'critical' } | null {
    const storage = getStorage();
    try {
      const raw = storage.getItem(DRAFT_FORM_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignored
    }
    return null;
  }

  /**
   * Helper to write all targets to storage safely with quota error handling.
   */
  private saveAllTargets(targets: WatchlistTarget[]): boolean {
    const storage = getStorage();
    try {
      const payload = JSON.stringify(targets);
      storage.setItem(this.storageKey, payload);
      this.storageQuotaExceeded = false;
      return true;
    } catch (err: any) {
      console.error('[TargetPersistenceService] Failed to write to localStorage:', err);
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.message?.includes('quota')) {
        this.storageQuotaExceeded = true;
      }
      return false;
    }
  }
}

// Global Singleton Instance
export const targetPersistenceService = new TargetPersistenceService();

import { useState, useEffect } from 'react';
import type { Workflow } from '@shared/schema';

// IndexedDB utilities for offline-first workflow caching
const DB_NAME = 'MedflectWorkflows';
const DB_VERSION = 1;
const STORE_NAME = 'workflows';

interface WorkflowCacheEntry {
  id: string;
  workflow: Workflow;
  lastModified: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

class WorkflowCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('lastModified', 'lastModified');
          store.createIndex('syncStatus', 'syncStatus');
        }
      };
    });
  }

  async getAllWorkflows(): Promise<WorkflowCacheEntry[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getWorkflow(id: string): Promise<WorkflowCacheEntry | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveWorkflow(workflow: Workflow, syncStatus: 'synced' | 'pending' = 'pending'): Promise<void> {
    if (!this.db) await this.init();
    
    const entry: WorkflowCacheEntry = {
      id: workflow.id,
      workflow,
      lastModified: Date.now(),
      syncStatus,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPendingSync(): Promise<WorkflowCacheEntry[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async markSynced(id: string): Promise<void> {
    const entry = await this.getWorkflow(id);
    if (entry) {
      entry.syncStatus = 'synced';
      await this.saveWorkflow(entry.workflow, 'synced');
    }
  }
}

const workflowCache = new WorkflowCache();

export function useWorkflowCache() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workflowCache.init()
      .then(() => setIsInitialized(true))
      .catch((err) => setError(err.message));
  }, []);

  const getCachedWorkflows = async (): Promise<Workflow[]> => {
    try {
      const entries = await workflowCache.getAllWorkflows();
      return entries.map(entry => entry.workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cached workflows');
      return [];
    }
  };

  const getCachedWorkflow = async (id: string): Promise<Workflow | null> => {
    try {
      const entry = await workflowCache.getWorkflow(id);
      return entry?.workflow || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cached workflow');
      return null;
    }
  };

  const cacheWorkflow = async (workflow: Workflow, syncStatus: 'synced' | 'pending' = 'pending'): Promise<void> => {
    try {
      await workflowCache.saveWorkflow(workflow, syncStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cache workflow');
    }
  };

  const deleteCachedWorkflow = async (id: string): Promise<void> => {
    try {
      await workflowCache.deleteWorkflow(id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cached workflow');
    }
  };

  const getPendingSync = async (): Promise<WorkflowCacheEntry[]> => {
    try {
      return await workflowCache.getPendingSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get pending sync');
      return [];
    }
  };

  const markSynced = async (id: string): Promise<void> => {
    try {
      await workflowCache.markSynced(id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as synced');
    }
  };

  const syncPendingWorkflows = async (syncFunction: (workflow: Workflow) => Promise<Workflow>): Promise<void> => {
    try {
      const pending = await getPendingSync();
      
      for (const entry of pending) {
        try {
          const synced = await syncFunction(entry.workflow);
          await cacheWorkflow(synced, 'synced');
        } catch (syncError) {
          // Mark as conflict for manual resolution
          entry.syncStatus = 'conflict';
          await workflowCache.saveWorkflow(entry.workflow, 'conflict');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync workflows');
    }
  };

  return {
    isInitialized,
    error,
    getCachedWorkflows,
    getCachedWorkflow,
    cacheWorkflow,
    deleteCachedWorkflow,
    getPendingSync,
    markSynced,
    syncPendingWorkflows,
  };
}
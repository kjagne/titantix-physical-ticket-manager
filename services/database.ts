import { Ticket, TicketTypeInfo } from '../types';

const DB_NAME = 'TitantixDB';
const DB_VERSION = 1;

// Database stores
const STORES = {
  TICKETS: 'tickets',
  DESIGNS: 'designs',
  BATCHES: 'batches',
};

export interface TicketDesign {
  id: string;
  name: string;
  backgroundImageUrl?: string;
  imageScale: number;
  imagePositionX: number;
  imagePositionY: number;
  ticketTypes: TicketTypeInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketBatch {
  id: string;
  batchId: string;
  ticketCount: number;
  designId?: string;
  createdAt: string;
}

class DatabaseService {
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

        // Tickets store - indexed by serial number
        if (!db.objectStoreNames.contains(STORES.TICKETS)) {
          const ticketStore = db.createObjectStore(STORES.TICKETS, { keyPath: 'serial' });
          ticketStore.createIndex('token', 'token', { unique: true });
          ticketStore.createIndex('status', 'status', { unique: false });
          ticketStore.createIndex('printBatchId', 'printBatchId', { unique: false });
          ticketStore.createIndex('ticketTypeName', 'ticketTypeName', { unique: false });
        }

        // Designs store - saved ticket designs/templates
        if (!db.objectStoreNames.contains(STORES.DESIGNS)) {
          const designStore = db.createObjectStore(STORES.DESIGNS, { keyPath: 'id' });
          designStore.createIndex('name', 'name', { unique: false });
          designStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Batches store - track print batches
        if (!db.objectStoreNames.contains(STORES.BATCHES)) {
          const batchStore = db.createObjectStore(STORES.BATCHES, { keyPath: 'id' });
          batchStore.createIndex('batchId', 'batchId', { unique: true });
          batchStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ==================== TICKET OPERATIONS ====================

  async saveTicket(ticket: Ticket): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS, 'readwrite');
      const request = store.put(ticket);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS, 'readwrite');
      let completed = 0;
      let hasError = false;

      tickets.forEach(ticket => {
        const request = store.put(ticket);
        request.onsuccess = () => {
          completed++;
          if (completed === tickets.length && !hasError) resolve();
        };
        request.onerror = () => {
          hasError = true;
          reject(request.error);
        };
      });
    });
  }

  async getTicket(serial: string): Promise<Ticket | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS);
      const request = store.get(serial);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTicketByToken(token: string): Promise<Ticket | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS);
      const index = store.index('token');
      const request = index.get(token);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTickets(): Promise<Ticket[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTicketsByBatch(batchId: string): Promise<Ticket[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS);
      const index = store.index('printBatchId');
      const request = index.getAll(batchId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateTicket(serial: string, updates: Partial<Ticket>): Promise<void> {
    const ticket = await this.getTicket(serial);
    if (!ticket) throw new Error('Ticket not found');
    const updatedTicket = { ...ticket, ...updates };
    return this.saveTicket(updatedTicket);
  }

  async deleteTicket(serial: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TICKETS, 'readwrite');
      const request = store.delete(serial);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== DESIGN OPERATIONS ====================

  async saveDesign(design: TicketDesign): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DESIGNS, 'readwrite');
      const request = store.put(design);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDesign(id: string): Promise<TicketDesign | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DESIGNS);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDesigns(): Promise<TicketDesign[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DESIGNS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDesign(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DESIGNS, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== BATCH OPERATIONS ====================

  async saveBatch(batch: TicketBatch): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.BATCHES, 'readwrite');
      const request = store.put(batch);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllBatches(): Promise<TicketBatch[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.BATCHES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== UTILITY OPERATIONS ====================

  async clearAllData(): Promise<void> {
    const stores = [STORES.TICKETS, STORES.DESIGNS, STORES.BATCHES];
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getStats(): Promise<{
    totalTickets: number;
    totalDesigns: number;
    totalBatches: number;
  }> {
    const [tickets, designs, batches] = await Promise.all([
      this.getAllTickets(),
      this.getAllDesigns(),
      this.getAllBatches(),
    ]);

    return {
      totalTickets: tickets.length,
      totalDesigns: designs.length,
      totalBatches: batches.length,
    };
  }

  // ==================== BACKUP & RESTORE ====================

  async exportDatabase(): Promise<string> {
    const [tickets, designs, batches] = await Promise.all([
      this.getAllTickets(),
      this.getAllDesigns(),
      this.getAllBatches(),
    ]);

    const backup = {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        tickets,
        designs,
        batches,
      },
    };

    return JSON.stringify(backup, null, 2);
  }

  async importDatabase(jsonData: string): Promise<{ 
    tickets: number; 
    designs: number; 
    batches: number; 
  }> {
    const backup = JSON.parse(jsonData);
    
    if (!backup.data) {
      throw new Error('Invalid backup file format');
    }

    const { tickets = [], designs = [], batches = [] } = backup.data;

    // Import in batches to avoid memory issues
    const BATCH_SIZE = 100;
    
    // Import tickets
    for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
      const batch = tickets.slice(i, i + BATCH_SIZE);
      await this.saveTickets(batch);
    }

    // Import designs
    for (const design of designs) {
      await this.saveDesign(design);
    }

    // Import batches
    for (const batch of batches) {
      await this.saveBatch(batch);
    }

    return {
      tickets: tickets.length,
      designs: designs.length,
      batches: batches.length,
    };
  }

  async downloadBackup(): Promise<void> {
    const jsonData = await this.exportDatabase();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titantix-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const db = new DatabaseService();

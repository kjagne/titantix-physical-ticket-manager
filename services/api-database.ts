// API-based database service (replaces IndexedDB)
import { Ticket, TicketTypeInfo } from '../types';

// Use environment variable in production, localhost in development
// In production, use same origin (Railway serves both frontend and backend)
// Check if we're on localhost, if not, use relative path
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : (isLocalhost ? 'http://localhost:4000/api' : '/api');

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

class ApiDatabaseService {
  private initialized = false;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async init(): Promise<void> {
    // Check if server is reachable
    try {
      const response = await fetch(`${API_URL}/stats`);
      if (response.ok) {
        this.initialized = true;
        console.log('✅ Connected to server database');
      }
    } catch (error) {
      console.error('❌ Failed to connect to server:', error);
      throw new Error('Server not reachable. Make sure the API server is running on port 4000.');
    }
  }

  // ==================== TICKET OPERATIONS ====================

  async saveTicket(ticket: Ticket): Promise<void> {
    const response = await fetch(`${API_URL}/tickets/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tickets: [ticket] })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save ticket');
    }
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    const response = await fetch(`${API_URL}/tickets/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tickets })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save tickets');
    }
    
    console.log(`✅ Saved ${tickets.length} tickets to server database`);
  }

  async getTicket(serial: string): Promise<Ticket | undefined> {
    const tickets = await this.getAllTickets();
    return tickets.find(t => t.serial === serial);
  }

  async getTicketByToken(token: string): Promise<Ticket | undefined> {
    const tickets = await this.getAllTickets();
    return tickets.find(t => t.token === token);
  }

  async getAllTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_URL}/tickets`);
    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return response.json();
  }

  async getTicketsByBatch(batchId: string): Promise<Ticket[]> {
    const tickets = await this.getAllTickets();
    return tickets.filter(t => t.printBatchId === batchId);
  }

  async updateTicket(serial: string, updates: Partial<Ticket>): Promise<void> {
    // For now, we'll fetch, update, and save back
    const ticket = await this.getTicket(serial);
    if (!ticket) throw new Error('Ticket not found');
    
    const updatedTicket = { ...ticket, ...updates };
    await this.saveTicket(updatedTicket);
  }

  async deleteTicket(serial: string): Promise<void> {
    const response = await fetch(`${API_URL}/tickets/${serial}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete ticket');
    }
    
    console.log(`✅ Deleted ticket ${serial} from server database`);
  }

  async deleteAllTickets(): Promise<void> {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete all tickets');
    }
    
    console.log('✅ Deleted all tickets from server database');
  }

  // ==================== DESIGN OPERATIONS ====================

  async saveDesign(design: TicketDesign): Promise<void> {
    const response = await fetch(`${API_URL}/designs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(design)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save design');
    }
    
    console.log(`✅ Saved design "${design.name}" to server database`);
  }

  async getDesign(id: string): Promise<TicketDesign | undefined> {
    const designs = await this.getAllDesigns();
    return designs.find(d => d.id === id);
  }

  async getAllDesigns(): Promise<TicketDesign[]> {
    const response = await fetch(`${API_URL}/designs`, {
      headers: this.getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch designs');
    }
    return response.json();
  }

  async deleteDesign(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/designs/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete design');
    }
    
    console.log(`✅ Deleted design from server database`);
  }

  // ==================== BATCH OPERATIONS ====================

  async saveBatch(batch: TicketBatch): Promise<void> {
    // Store batch info with tickets
    console.log(`Batch ${batch.batchId} saved`);
  }

  async getAllBatches(): Promise<TicketBatch[]> {
    // Get unique batches from tickets
    const tickets = await this.getAllTickets();
    const batchIds = [...new Set(tickets.map(t => t.printBatchId).filter(Boolean))];
    
    return batchIds.map(batchId => ({
      id: batchId!,
      batchId: batchId!,
      ticketCount: tickets.filter(t => t.printBatchId === batchId).length,
      createdAt: new Date().toISOString()
    }));
  }

  // ==================== UTILITY OPERATIONS ====================

  async clearAllData(): Promise<void> {
    console.warn('Clear all data not implemented for API database');
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
}

// Singleton instance
export const db = new ApiDatabaseService();

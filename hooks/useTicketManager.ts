import { useState, useCallback, useEffect } from 'react';
import { Ticket, TicketStatus, TicketTypeInfo } from '../types';
import { generateSerial, generateSignedToken, verifyToken } from '../services/ticketService';
import { db, TicketBatch } from '../services/api-database';

export const useTicketManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastGeneratedBatch, setLastGeneratedBatch] = useState<Ticket[]>([]);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize database (don't load all tickets to avoid memory issues)
  useEffect(() => {
    const initDb = async () => {
      try {
        await db.init();
        // Load ticket count only, not all tickets
        await refreshTicketCount();
        setIsDbReady(true);
        console.log('Database initialized.');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initDb();
  }, []);

  const refreshTicketCount = useCallback(async () => {
    try {
      const stats = await db.getStats();
      setTicketCount(stats.totalTickets);
    } catch (error) {
      console.error('Failed to get ticket count:', error);
    }
  }, []);

  const generateTickets = useCallback(async (
    ticketTypes: TicketTypeInfo[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const allNewTickets: Ticket[] = [];
    const printBatchId = `BATCH-${Date.now()}`;
    const BATCH_SIZE = 50; // Reduced from 100 to 50 for better stability
    const MAX_RETRIES = 3;
    
    // Calculate total tickets to generate
    const totalTickets = ticketTypes.reduce((acc, type) => acc + type.quantity, 0);
    let processedCount = 0;

    // Helper function to save tickets with retry logic
    const saveTicketsWithRetry = async (tickets: Ticket[], retryCount = 0): Promise<void> => {
      try {
        await db.saveTickets(tickets);
      } catch (error) {
        if (retryCount < MAX_RETRIES) {
          console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} for saving ${tickets.length} tickets...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return saveTicketsWithRetry(tickets, retryCount + 1);
        }
        throw error;
      }
    };

    // Generate tickets in batches to avoid memory issues
    for (const type of ticketTypes) {
      const quantity = type.quantity;
      
      // Process this ticket type in chunks
      for (let offset = 0; offset < quantity; offset += BATCH_SIZE) {
        const chunkSize = Math.min(BATCH_SIZE, quantity - offset);
        
        // Generate tickets for this chunk
        const ticketsWithTokens: Ticket[] = [];
        
        // Generate serials and tokens sequentially in smaller batches to reduce memory pressure
        for (let i = 0; i < chunkSize; i++) {
          const serial = generateSerial(type.name);
          const token = await generateSignedToken(serial);
          
          ticketsWithTokens.push({
            serial,
            token,
            status: TicketStatus.SOLD,
            ticketTypeName: type.name,
            price: type.price,
            printBatchId,
            stubColor: type.stubColor,
          });
        }
        
        // Save this chunk to database immediately with retry logic
        try {
          await saveTicketsWithRetry(ticketsWithTokens);
          
          // Only keep last batch in memory, not all tickets
          if (offset + chunkSize >= quantity && type === ticketTypes[ticketTypes.length - 1]) {
            // This is the last chunk of the last type, keep for preview
            allNewTickets.push(...ticketsWithTokens);
          }
          
          processedCount += chunkSize;
          
          // Report progress
          if (onProgress) {
            onProgress(processedCount, totalTickets);
          }
          
          console.log(`✓ Saved chunk: ${processedCount}/${totalTickets} tickets (${Math.round((processedCount / totalTickets) * 100)}%)`);
          
          // Small delay to prevent overwhelming the server
          if (processedCount < totalTickets) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.error('Failed to save ticket chunk after retries:', error);
          throw new Error(`Failed to save tickets at ${processedCount}/${totalTickets}. Please try again.`);
        }
      }
    }

    // Save batch info
    try {
      const batch: TicketBatch = {
        id: `batch-${Date.now()}`,
        batchId: printBatchId,
        ticketCount: totalTickets,
        createdAt: new Date().toISOString(),
      };
      await db.saveBatch(batch);
      
      console.log(`✅ Completed: ${totalTickets} tickets in batch ${printBatchId}`);
    } catch (error) {
      console.error('Failed to save batch info:', error);
    }

    // Only keep last few tickets for preview to save memory
    const previewTickets = allNewTickets.slice(-10);
    setLastGeneratedBatch(previewTickets);
    
    // Clear tickets state to free memory
    setTickets([]);
    
    // Refresh ticket count for display
    await refreshTicketCount();
  }, [refreshTicketCount]);

  const findTicket = useCallback((serial: string) => {
    const cleanedSerial = serial.toUpperCase().trim();
    return tickets.find(t => t.serial === cleanedSerial);
  }, [tickets]);

  const updateTicket = useCallback(async (serial: string, updates: Partial<Ticket>) => {
    const cleanedSerial = serial.toUpperCase().trim();
    
    // Update in database
    try {
      await db.updateTicket(cleanedSerial, updates);
    } catch (error) {
      console.error('Failed to update ticket in database:', error);
    }
    
    // Update in state
    setTickets(prev => 
      prev.map(t => t.serial === cleanedSerial ? { ...t, ...updates } : t)
    );
    setLastGeneratedBatch(prev => 
      prev.map(t => t.serial === cleanedSerial ? { ...t, ...updates } : t)
    );
  }, []);

  const sellTicket = useCallback((serial: string) => {
    const ticket = findTicket(serial);
    if (!ticket) {
      return { success: false, message: 'Ticket serial not found.' };
    }
    if (ticket.status !== TicketStatus.UNSOLD) {
      return { success: false, message: `Ticket already ${ticket.status.toLowerCase()}.` };
    }
    updateTicket(serial, { 
      status: TicketStatus.SOLD,
      soldAt: new Date().toISOString(),
    });
    return { success: true, message: `Ticket ${serial} sold successfully!`, ticket };
  }, [findTicket, updateTicket]);


  const scanTicket = useCallback(async (scannedData: string) => {
    let serial: string | null = null;
    let ticket: Ticket | undefined;
    const cleanedData = scannedData.trim();

    // The QR code contains the full token. A manual entry would be the serial.
    // Tokens have a '.' separator, serials (e.g., VIP-ABCD-EFGH-IJKL) do not.
    if (cleanedData.includes('.')) {
        const token = cleanedData;
        
        // 1. Verify token integrity
        const isTokenValid = await verifyToken(token);
        if (!isTokenValid) {
           return { success: false, message: 'Invalid token signature. Counterfeit detected.' };
        }

        // 2. Decode payload to find serial
        try {
            const [encodedPayload] = token.split('.');
            const payload = JSON.parse(atob(encodedPayload));
            serial = payload?.s;
            if (!serial) {
                 return { success: false, message: 'Invalid QR code payload structure.' };
            }
        } catch (e) {
            return { success: false, message: 'Could not decode QR code. Invalid format.' };
        }
        
        // 3. Find ticket in our system using the serial from the token
        ticket = findTicket(serial);

    } else { // Assumed to be a serial number
        serial = cleanedData;
        ticket = findTicket(serial);
        
        // If ticket is found via serial, we should still validate its stored token.
        if (ticket) {
            const isTokenValid = await verifyToken(ticket.token);
            if (!isTokenValid) {
                // This is an anomaly. The ticket exists but its token is invalid.
                return { success: false, message: 'Internal validation error. Stored token is invalid.' };
            }
        }
    }

    // 4. Check if ticket exists in the database
    if (!ticket) {
      return { success: false, message: 'Ticket not found in system. Potential counterfeit.' };
    }
    
    // 5. Check ticket status (unsold, sold, used)
    switch (ticket.status) {
      case TicketStatus.UNSOLD:
        return { success: false, message: 'This ticket has not been sold yet.' };
      case TicketStatus.SOLD:
        const updates = {
          status: TicketStatus.USED,
          usedAt: new Date().toISOString(),
          usedByDevice: `GATE-${generateRandomChars(4)}`,
        };
        updateTicket(ticket.serial, updates);
        return { success: true, message: 'Check-in successful. Welcome!', ticket: { ...ticket, ...updates } };
      case TicketStatus.USED:
        return { success: false, message: `DUPLICATE SCAN. Already used at ${new Date(ticket.usedAt!).toLocaleString()} by ${ticket.usedByDevice}.` };
      default:
        return { success: false, message: 'Unknown ticket status.' };
    }
  }, [findTicket, updateTicket]);
  
  const generateRandomChars = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const deleteTicket = useCallback(async (serial: string) => {
    try {
      await db.deleteTicket(serial);
      setTickets(prev => prev.filter(t => t.serial !== serial));
      setLastGeneratedBatch(prev => prev.filter(t => t.serial !== serial));
      console.log('Ticket deleted:', serial);
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      throw error;
    }
  }, []);

  const deleteAllTickets = useCallback(async () => {
    try {
      await db.deleteAllTickets();
      setTickets([]);
      setLastGeneratedBatch([]);
      console.log('All tickets deleted');
    } catch (error) {
      console.error('Failed to delete all tickets:', error);
      throw error;
    }
  }, []);

  return {
    tickets,
    lastGeneratedBatch,
    ticketCount,
    generateTickets,
    sellTicket,
    scanTicket,
    findTicket,
    deleteTicket,
    deleteAllTickets,
    refreshTicketCount,
    isDbReady,
  };
};
// API endpoints for Flutter app sync
import express from 'express';
import { db } from '../services/database';

const router = express.Router();

// GET /api/tickets - Get all tickets for offline sync
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await db.getAllTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// POST /api/tickets/sync - Upload used tickets from offline scans
router.post('/tickets/sync', async (req, res) => {
  try {
    const { tickets } = req.body;
    
    if (!Array.isArray(tickets)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    // Update each ticket in the database
    for (const ticket of tickets) {
      await db.updateTicket(ticket.serial, {
        status: ticket.status,
        usedAt: ticket.usedAt,
        usedByDevice: ticket.usedByDevice,
      });
    }

    res.json({ 
      success: true, 
      message: `Updated ${tickets.length} tickets`,
      count: tickets.length 
    });
  } catch (error) {
    console.error('Error syncing tickets:', error);
    res.status(500).json({ error: 'Failed to sync tickets' });
  }
});

export default router;

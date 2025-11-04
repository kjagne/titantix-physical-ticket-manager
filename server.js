// Express server with SQLite database
import express from 'express';
import cors from 'cors';
import { ticketDb } from './server-db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authMiddleware,
  createDefaultAdmin 
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Create default admin user on startup
await createDefaultAdmin();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase payload limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In production, serve the built frontend
if (isProduction) {
  app.use(express.static(join(__dirname, 'dist')));
} else {
  app.use(express.static('.')); // Serve static files from current directory in dev
}

// ==================== AUTHENTICATION ROUTES ====================

// POST /api/auth/register - Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = ticketDb.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = 'user-' + Date.now();
    
    ticketDb.createUser({
      id: userId,
      email,
      password: hashedPassword,
      name,
      role: 'admin'
    });

    // Generate token
    const token = generateToken(userId, email);

    console.log(`✅ New user registered: ${email}`);
    res.json({ 
      success: true, 
      token,
      user: { id: userId, email, name, role: 'admin' }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = ticketDb.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    console.log(`✅ User logged in: ${email}`);
    res.json({ 
      success: true, 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Get current user (protected route)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = ticketDb.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROTECTED ROUTES ====================

// GET /api/tickets - Get all tickets for offline sync
app.get('/api/tickets', (req, res) => {
  try {
    console.log('📥 Flutter app requesting tickets...');
    const tickets = ticketDb.getAllTickets();
    console.log(`✓ Sending ${tickets.length} tickets`);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/sync - Upload used tickets from offline scans
app.post('/api/tickets/sync', (req, res) => {
  try {
    const { tickets: updatedTickets } = req.body;
    
    console.log(`📤 Received ${updatedTickets.length} used tickets from Flutter app`);
    
    // Update each ticket in database
    updatedTickets.forEach(updatedTicket => {
      ticketDb.updateTicket(updatedTicket.serial, {
        status: updatedTicket.status,
        usedAt: updatedTicket.usedAt,
        usedByDevice: updatedTicket.usedByDevice
      });
      console.log(`✓ Updated ticket ${updatedTicket.serial}`);
    });

    res.json({ 
      success: true, 
      message: `Updated ${updatedTickets.length} tickets`,
      count: updatedTickets.length 
    });
  } catch (error) {
    console.error('Error syncing tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/bulk - Add tickets from web app (protected)
app.post('/api/tickets/bulk', authMiddleware, (req, res) => {
  try {
    const { tickets: newTickets } = req.body;
    const count = ticketDb.insertTickets(newTickets);
    console.log(`✓ Saved ${count} tickets to database`);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error saving tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tickets/:serial - Delete ticket (protected)
app.delete('/api/tickets/:serial', authMiddleware, (req, res) => {
  try {
    const { serial } = req.params;
    ticketDb.deleteTicket(serial);
    console.log(`✓ Deleted ticket: ${serial}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tickets - Delete all tickets (protected)
app.delete('/api/tickets', authMiddleware, (req, res) => {
  try {
    ticketDb.clearAllTickets();
    console.log('✓ Deleted all tickets');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting all tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats - Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = ticketDb.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/designs - Save design (protected)
app.post('/api/designs', authMiddleware, (req, res) => {
  try {
    const design = req.body;
    ticketDb.saveDesign(design);
    console.log(`✓ Saved design: ${design.name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/designs - Get all designs (protected)
app.get('/api/designs', authMiddleware, (req, res) => {
  try {
    const designs = ticketDb.getAllDesigns();
    res.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/designs/:id - Delete design (protected)
app.delete('/api/designs/:id', authMiddleware, (req, res) => {
  try {
    ticketDb.deleteDesign(req.params.id);
    console.log(`✓ Deleted design: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route to serve frontend in production
if (isProduction) {
  app.use((req, res, next) => {
    // If no API route matched, serve the frontend
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🎫 Titantix API Server Running                            ║
║                                                            ║
║  Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}                              ║
║  📱 Flutter App Endpoint: http://192.168.100.144:${PORT}    ║
║  🌐 Web App Endpoint:     http://localhost:${PORT}          ║
║                                                            ║
║  Available Endpoints:                                      ║
║  GET  /api/tickets       - Get all tickets                ║
║  POST /api/tickets/sync  - Sync used tickets              ║
║  POST /api/tickets/bulk  - Load tickets from web app      ║
║  GET  /api/stats         - Get statistics                 ║
╚════════════════════════════════════════════════════════════╝
  `);
});

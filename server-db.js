// Server-side SQLite database (NOT browser database)
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database file in server directory
const db = new Database(join(__dirname, 'titantix.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    serial TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    ticketTypeName TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNSOLD',
    stubColor TEXT,
    printBatchId TEXT,
    usedAt TEXT,
    usedByDevice TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_batch ON tickets(printBatchId);
  CREATE INDEX IF NOT EXISTS idx_type ON tickets(ticketTypeName);

  CREATE TABLE IF NOT EXISTS designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    backgroundImageUrl TEXT,
    imageScale REAL,
    imagePositionX REAL,
    imagePositionY REAL,
    ticketTypes TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    batchId TEXT NOT NULL UNIQUE,
    ticketCount INTEGER NOT NULL,
    designId TEXT,
    createdAt TEXT NOT NULL
  );
`);

console.log('✅ Server database initialized: titantix.db');

// Database operations
export const ticketDb = {
  // Insert multiple tickets (optimized for large batches)
  insertTickets: (tickets) => {
    if (!tickets || tickets.length === 0) return 0;
    
    const insert = db.prepare(`
      INSERT OR REPLACE INTO tickets 
      (serial, token, ticketTypeName, price, status, stubColor, printBatchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a transaction for atomic batch insertion
    const insertMany = db.transaction((tickets) => {
      const now = new Date().toISOString();
      for (const ticket of tickets) {
        insert.run(
          ticket.serial,
          ticket.token,
          ticket.ticketTypeName,
          ticket.price,
          ticket.status || 'SOLD',
          ticket.stubColor || '#F3F1EC',
          ticket.printBatchId || null,
          ticket.createdAt || now,
          now
        );
      }
    });

    // Execute the transaction with WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    
    // Execute the transaction
    insertMany(tickets);
    return tickets.length;
  },

  // Get all tickets
  getAllTickets: () => {
    return db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();
  },

  // Get tickets with pagination (for large datasets)
  getTicketsPaginated: (limit, offset) => {
    return db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC LIMIT ? OFFSET ?')
      .all(limit, offset);
  },

  // Get ticket by serial
  getTicket: (serial) => {
    return db.prepare('SELECT * FROM tickets WHERE serial = ?').get(serial);
  },

  // Update ticket status
  updateTicket: (serial, updates) => {
    const ticket = ticketDb.getTicket(serial);
    if (!ticket) throw new Error('Ticket not found');

    const updatedAt = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE tickets 
      SET status = ?, usedAt = ?, usedByDevice = ?, updatedAt = ?
      WHERE serial = ?
    `);

    stmt.run(
      updates.status || ticket.status,
      updates.usedAt || ticket.usedAt,
      updates.usedByDevice || ticket.usedByDevice,
      updatedAt,
      serial
    );
  },

  // Get statistics
  getStats: () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
    const used = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = ?').get('USED').count;
    const sold = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = ?').get('SOLD').count;
    const unsold = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = ?').get('UNSOLD').count;

    return { total, used, sold, unsold };
  },

  // Delete single ticket
  deleteTicket: (serial) => {
    const result = db.prepare('DELETE FROM tickets WHERE serial = ?').run(serial);
    if (result.changes === 0) {
      throw new Error('Ticket not found');
    }
  },

  // Clear all tickets
  clearAllTickets: () => {
    db.prepare('DELETE FROM tickets').run();
  },

  // Save design
  saveDesign: (design) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO designs 
      (id, name, backgroundImageUrl, imageScale, imagePositionX, imagePositionY, ticketTypes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      design.id,
      design.name,
      design.backgroundImageUrl || null,
      design.imageScale || 100,
      design.imagePositionX || 50,
      design.imagePositionY || 50,
      JSON.stringify(design.ticketTypes),
      design.createdAt || now,
      now
    );
  },

  // Get all designs
  getAllDesigns: () => {
    const designs = db.prepare('SELECT * FROM designs ORDER BY createdAt DESC').all();
    return designs.map(d => ({
      ...d,
      ticketTypes: JSON.parse(d.ticketTypes)
    }));
  },

  // Delete design
  deleteDesign: (id) => {
    db.prepare('DELETE FROM designs WHERE id = ?').run(id);
  },

  // ==================== USER OPERATIONS ====================
  
  // Create user
  createUser: (user) => {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      user.id,
      user.email,
      user.password,
      user.name || null,
      user.role || 'admin',
      now,
      now
    );
  },

  // Get user by email
  getUserByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  // Get user by ID
  getUserById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  // Get all users
  getAllUsers: () => {
    return db.prepare('SELECT id, email, name, role, createdAt FROM users').all();
  }
};

export default db;

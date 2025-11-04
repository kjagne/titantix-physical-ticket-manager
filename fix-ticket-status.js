// Quick script to update existing tickets from UNSOLD to SOLD
import Database from 'better-sqlite3';

const db = new Database('./titantix.db');

// Update all UNSOLD tickets to SOLD
const result = db.prepare(`
  UPDATE tickets 
  SET status = 'SOLD', updatedAt = ?
  WHERE status = 'UNSOLD'
`).run(new Date().toISOString());

console.log(`✅ Updated ${result.changes} tickets from UNSOLD to SOLD`);

// Show current stats
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) as sold,
    SUM(CASE WHEN status = 'USED' THEN 1 ELSE 0 END) as used,
    SUM(CASE WHEN status = 'UNSOLD' THEN 1 ELSE 0 END) as unsold
  FROM tickets
`).get();

console.log('\n📊 Current Database Stats:');
console.log(`   Total: ${stats.total}`);
console.log(`   Sold: ${stats.sold}`);
console.log(`   Used: ${stats.used}`);
console.log(`   Unsold: ${stats.unsold}`);

db.close();

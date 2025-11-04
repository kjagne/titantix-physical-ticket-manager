import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/ticket.dart';

class DatabaseService {
  static Database? _database;
  
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'titantix_tickets.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) {
        return db.execute(
          '''CREATE TABLE tickets(
            serial TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            ticketTypeName TEXT NOT NULL,
            price INTEGER NOT NULL,
            status TEXT NOT NULL,
            usedAt TEXT,
            usedByDevice TEXT,
            synced INTEGER NOT NULL DEFAULT 1
          )''',
        );
      },
    );
  }

  // Insert all tickets (during initial sync)
  Future<void> insertTickets(List<Ticket> tickets) async {
    final db = await database;
    Batch batch = db.batch();
    for (var ticket in tickets) {
      batch.insert('tickets', ticket.toMap(), 
        conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
    print('Inserted ${tickets.length} tickets into database');
  }

  // Get ticket by serial or token
  Future<Ticket?> getTicket(String serialOrToken) async {
    final db = await database;
    
    // Try by serial first
    List<Map<String, dynamic>> maps = await db.query(
      'tickets',
      where: 'serial = ?',
      whereArgs: [serialOrToken.toUpperCase()],
    );
    
    // If not found, try by token
    if (maps.isEmpty) {
      maps = await db.query(
        'tickets',
        where: 'token = ?',
        whereArgs: [serialOrToken],
      );
    }
    
    if (maps.isEmpty) return null;
    return Ticket.fromMap(maps.first);
  }

  // Mark ticket as used (OFFLINE)
  Future<bool> markTicketAsUsed(String serial, String deviceId) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();
    
    int result = await db.update(
      'tickets',
      {
        'status': 'USED',
        'usedAt': now,
        'usedByDevice': deviceId,
        'synced': 0, // Mark as not synced
      },
      where: 'serial = ? AND status = ?',
      whereArgs: [serial, 'SOLD'],
    );
    
    return result > 0;
  }

  // Get all tickets
  Future<List<Ticket>> getAllTickets() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('tickets');
    return List.generate(maps.length, (i) => Ticket.fromMap(maps[i]));
  }

  // Get unsynced tickets (for later sync)
  Future<List<Ticket>> getUnsyncedTickets() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'tickets',
      where: 'synced = ?',
      whereArgs: [0],
    );
    return List.generate(maps.length, (i) => Ticket.fromMap(maps[i]));
  }

  // Mark tickets as synced
  Future<void> markAsSynced(List<String> serials) async {
    final db = await database;
    Batch batch = db.batch();
    for (var serial in serials) {
      batch.update(
        'tickets',
        {'synced': 1},
        where: 'serial = ?',
        whereArgs: [serial],
      );
    }
    await batch.commit(noResult: true);
  }

  // Get statistics
  Future<Map<String, int>> getStats() async {
    final db = await database;
    final total = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tickets')
    ) ?? 0;
    final used = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tickets WHERE status = ?', ['USED'])
    ) ?? 0;
    final unsynced = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM tickets WHERE synced = 0')
    ) ?? 0;
    
    return {
      'total': total,
      'used': used,
      'remaining': total - used,
      'unsynced': unsynced,
    };
  }

  // Clear all tickets
  Future<void> clearAllTickets() async {
    final db = await database;
    await db.delete('tickets');
    print('All tickets cleared from database');
  }
}

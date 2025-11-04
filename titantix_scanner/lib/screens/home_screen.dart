import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/database_service.dart';
import '../models/ticket.dart';
import 'scanner_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseService _dbService = DatabaseService();
  bool _isLoading = false;
  Map<String, int> _stats = {};
  String _syncUrl = 'http://192.168.100.144:4000'; // API server on port 4000

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await _dbService.getStats();
    setState(() {
      _stats = stats;
    });
  }

  Future<void> _syncTickets() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch all tickets from web app
      final response = await http.get(
        Uri.parse('$_syncUrl/api/tickets'),
      ).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final tickets = data.map((json) => Ticket.fromJson(json)).toList();

        // Clear old tickets and insert new ones
        await _dbService.clearAllTickets();
        await _dbService.insertTickets(tickets);

        await _loadStats();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Synced ${tickets.length} tickets successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        throw Exception('Failed to load tickets');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sync failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _uploadUsedTickets() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final unsyncedTickets = await _dbService.getUnsyncedTickets();

      if (unsyncedTickets.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No tickets to sync'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      // Upload unsynced tickets
      final response = await http.post(
        Uri.parse('$_syncUrl/api/tickets/sync'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'tickets': unsyncedTickets.map((t) => t.toJson()).toList(),
        }),
      ).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        // Mark as synced
        await _dbService.markAsSynced(
          unsyncedTickets.map((t) => t.serial).toList(),
        );

        await _loadStats();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ Uploaded ${unsyncedTickets.length} used tickets!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        throw Exception('Failed to upload tickets');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Titantix Scanner'),
        backgroundColor: Colors.deepPurple,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo/Header
                  Icon(
                    Icons.qr_code_scanner,
                    size: 100,
                    color: Colors.deepPurple,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Offline Ticket Scanner',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Works 100% offline after sync',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 40),

                  // Stats Cards
                  Card(
                    elevation: 4,
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Text(
                            'Database Statistics',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _StatColumn('Total', '${_stats['total'] ?? 0}', Colors.blue),
                              _StatColumn('Used', '${_stats['used'] ?? 0}', Colors.green),
                              _StatColumn('Remaining', '${_stats['remaining'] ?? 0}', Colors.orange),
                            ],
                          ),
                          if ((_stats['unsynced'] ?? 0) > 0) ...[
                            SizedBox(height: 20),
                            Container(
                              padding: EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.warning, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text(
                                    '${_stats['unsynced']} tickets need syncing',
                                    style: TextStyle(
                                      color: Colors.red.shade900,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 30),

                  // Start Scanning Button
                  ElevatedButton.icon(
                    onPressed: () {
                      if ((_stats['total'] ?? 0) == 0) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Please sync tickets first!'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                        return;
                      }
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => ScannerScreen()),
                      ).then((_) => _loadStats());
                    },
                    icon: Icon(Icons.qr_code_scanner, size: 32),
                    label: Text(
                      'START SCANNING',
                      style: TextStyle(fontSize: 18),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.deepPurple,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  SizedBox(height: 16),

                  // Sync Tickets Button
                  OutlinedButton.icon(
                    onPressed: _syncTickets,
                    icon: Icon(Icons.cloud_download),
                    label: Text('SYNC TICKETS FROM SERVER'),
                    style: OutlinedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      side: BorderSide(color: Colors.deepPurple, width: 2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  SizedBox(height: 12),

                  // Upload Used Tickets Button
                  if ((_stats['unsynced'] ?? 0) > 0)
                    OutlinedButton.icon(
                      onPressed: _uploadUsedTickets,
                      icon: Icon(Icons.cloud_upload),
                      label: Text('UPLOAD USED TICKETS'),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: Colors.green, width: 2),
                        foregroundColor: Colors.green,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  SizedBox(height: 30),

                  // Info Card
                  Card(
                    color: Colors.blue.shade50,
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.info, color: Colors.blue),
                              SizedBox(width: 8),
                              Text(
                                'How it works',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 12),
                          Text('1. Sync tickets before the event (requires internet)'),
                          SizedBox(height: 6),
                          Text('2. Scan tickets offline during the event'),
                          SizedBox(height: 6),
                          Text('3. Upload used tickets when internet is available'),
                          SizedBox(height: 12),
                          Text(
                            '✓ Works 100% offline after initial sync',
                            style: TextStyle(
                              color: Colors.green.shade700,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  _StatColumn(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }
}

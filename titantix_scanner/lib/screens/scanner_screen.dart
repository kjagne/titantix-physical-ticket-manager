import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/database_service.dart';
import '../services/crypto_service.dart';
import '../models/ticket.dart';
import 'package:device_info_plus/device_info_plus.dart';

class ScannerScreen extends StatefulWidget {
  @override
  _ScannerScreenState createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final DatabaseService _dbService = DatabaseService();
  MobileScannerController cameraController = MobileScannerController();
  
  bool _isProcessing = false;
  String? _lastScannedCode;
  String _deviceId = '';
  Map<String, int> _stats = {};
  String _syncUrl = 'http://192.168.100.144:4000'; // API server URL

  @override
  void initState() {
    super.initState();
    _loadDeviceId();
    _loadStats();
  }

  Future<void> _loadDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();
    try {
      if (Theme.of(context).platform == TargetPlatform.android) {
        final androidInfo = await deviceInfo.androidInfo;
        setState(() {
          _deviceId = 'GATE-${androidInfo.id.substring(0, 4).toUpperCase()}';
        });
      } else if (Theme.of(context).platform == TargetPlatform.iOS) {
        final iosInfo = await deviceInfo.iosInfo;
        setState(() {
          _deviceId = 'GATE-${iosInfo.identifierForVendor?.substring(0, 4).toUpperCase() ?? "IOS"}';
        });
      }
    } catch (e) {
      setState(() {
        _deviceId = 'GATE-${DateTime.now().millisecondsSinceEpoch.toString().substring(0, 4)}';
      });
    }
  }

  Future<void> _loadStats() async {
    final stats = await _dbService.getStats();
    setState(() {
      _stats = stats;
    });
  }

  Future<void> _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    // Prevent duplicate scans
    if (code == _lastScannedCode) return;

    setState(() {
      _isProcessing = true;
      _lastScannedCode = code;
    });

    await _validateTicket(code);
    
    // Don't auto-reset here - let dialogs handle it
  }

  Future<void> _validateTicket(String scannedData) async {
    try {
      String? serial;
      Ticket? ticket;

      // Check if it's a token (contains '.') or serial
      if (scannedData.contains('.')) {
        // It's a QR code token
        final token = scannedData;

        // 1. Verify token integrity
        final isValid = await CryptoService.verifyToken(token);
        if (!isValid) {
          _showResult(false, 'Invalid QR Code - Counterfeit Detected!', Colors.red);
          return;
        }

        // 2. Extract serial from token
        serial = await CryptoService.getSerialFromToken(token);
        if (serial == null) {
          _showResult(false, 'Invalid QR Code Format', Colors.red);
          return;
        }

        // 3. Find ticket in database
        ticket = await _dbService.getTicket(serial);
      } else {
        // It's a serial number
        serial = scannedData.toUpperCase();
        ticket = await _dbService.getTicket(serial);

        // Verify stored token if found
        if (ticket != null) {
          final isValid = await CryptoService.verifyToken(ticket.token);
          if (!isValid) {
            _showResult(false, 'Internal Validation Error', Colors.red);
            return;
          }
        }
      }

      // 4. Check if ticket exists
      if (ticket == null) {
        _showResult(false, 'Ticket Not Found - Potential Counterfeit', Colors.red);
        return;
      }

      // 5. Check ticket status
      switch (ticket.status) {
        case 'UNSOLD':
          _showResult(false, 'Ticket Not Sold Yet', Colors.orange);
          break;
        case 'SOLD':
          // Show ticket details with Accept button
          _showTicketDetailsForAcceptance(ticket);
          break;
        case 'USED':
          _showResult(
            false,
            'DUPLICATE SCAN!\n\nAlready used at:\n${ticket.usedAt}\nby ${ticket.usedByDevice}',
            Colors.red,
          );
          break;
        default:
          _showResult(false, 'Unknown Ticket Status', Colors.orange);
      }
    } catch (e) {
      _showResult(false, 'Error: ${e.toString()}', Colors.red);
    }
  }

  void _showTicketDetailsForAcceptance(Ticket ticket) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Column(
          children: [
            Icon(Icons.check_circle_outline, color: Colors.green, size: 64),
            SizedBox(height: 16),
            Text(
              'Valid Ticket',
              style: TextStyle(color: Colors.green, fontSize: 24, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Container(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetailRow('Serial', ticket.serial, Icons.confirmation_number),
              SizedBox(height: 12),
              _buildDetailRow('Type', ticket.ticketTypeName, Icons.category),
              SizedBox(height: 12),
              _buildDetailRow('Price', 'GMD ${ticket.price}', Icons.attach_money),
              SizedBox(height: 12),
              _buildDetailRow('Status', ticket.status, Icons.info),
              SizedBox(height: 20),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.verified, color: Colors.green, size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'This ticket is valid and ready for check-in',
                        style: TextStyle(color: Colors.green.shade900, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              setState(() {
                _isProcessing = false;
                _lastScannedCode = null;
              });
            },
            child: Text('CANCEL', style: TextStyle(color: Colors.grey.shade600)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _acceptTicket(ticket);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check, color: Colors.white),
                SizedBox(width: 8),
                Text('ACCEPT', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade600),
        SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _acceptTicket(Ticket ticket) async {
    try {
      // Mark as used in local database
      final success = await _dbService.markTicketAsUsed(ticket.serial, _deviceId);
      
      if (success) {
        // Update stats
        await _loadStats();
        
        // Try to sync to server in background (don't wait for it)
        _syncToServerInBackground(ticket);
        
        // Show success message
        _showResult(
          true,
          'CHECK-IN SUCCESSFUL!\n\n${ticket.ticketTypeName}\nGMD ${ticket.price}\n\nWelcome!',
          Colors.green,
        );
      } else {
        _showResult(false, 'Failed to mark ticket as used', Colors.red);
      }
    } catch (e) {
      _showResult(false, 'Error: ${e.toString()}', Colors.red);
    }
  }

  Future<void> _syncToServerInBackground(Ticket ticket) async {
    try {
      // Get the updated ticket from database
      final updatedTicket = await _dbService.getTicket(ticket.serial);
      if (updatedTicket == null) return;

      // Try to sync to server (non-blocking)
      final response = await http.post(
        Uri.parse('${_syncUrl}/api/tickets/sync'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'tickets': [
            {
              'serial': updatedTicket.serial,
              'status': updatedTicket.status,
              'usedAt': updatedTicket.usedAt,
              'usedByDevice': updatedTicket.usedByDevice,
            }
          ]
        }),
      ).timeout(Duration(seconds: 5));

      if (response.statusCode == 200) {
        // Mark as synced in local database
        await _dbService.markAsSynced([updatedTicket.serial]);
        print('✅ Ticket synced to server in background');
      }
    } catch (e) {
      // Silently fail - ticket is already saved locally
      print('⚠️ Background sync failed (will retry later): $e');
    }
  }

  void _showResult(bool success, String message, Color color) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: color,
        title: Icon(
          success ? Icons.check_circle : Icons.error,
          color: Colors.white,
          size: 64,
        ),
        content: Text(
          message,
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );

    Future.delayed(Duration(seconds: 2), () {
      if (mounted) {
        Navigator.of(context).pop();
        // Reset scanning state
        setState(() {
          _isProcessing = false;
          _lastScannedCode = null;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Titantix Scanner'),
        backgroundColor: Colors.deepPurple,
        actions: [
          IconButton(
            icon: Icon(Icons.info),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text('Scanner Info'),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Device ID: $_deviceId'),
                      SizedBox(height: 8),
                      Text('Total Tickets: ${_stats['total'] ?? 0}'),
                      Text('Used: ${_stats['used'] ?? 0}'),
                      Text('Remaining: ${_stats['remaining'] ?? 0}'),
                      Text('Unsynced: ${_stats['unsynced'] ?? 0}'),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text('Close'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats Bar
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.deepPurple.shade50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatCard('Total', '${_stats['total'] ?? 0}', Colors.blue),
                _StatCard('Used', '${_stats['used'] ?? 0}', Colors.green),
                _StatCard('Remaining', '${_stats['remaining'] ?? 0}', Colors.orange),
                _StatCard('Unsynced', '${_stats['unsynced'] ?? 0}', Colors.red),
              ],
            ),
          ),

          // Scanner View
          Expanded(
            child: Stack(
              children: [
                MobileScanner(
                  controller: cameraController,
                  onDetect: _handleBarcode,
                ),
                // Overlay
                Center(
                  child: Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                // Instructions
                Positioned(
                  bottom: 50,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: EdgeInsets.all(16),
                    color: Colors.black54,
                    child: Text(
                      'Align QR code within the frame',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          cameraController.toggleTorch();
        },
        child: Icon(Icons.flash_on),
        backgroundColor: Colors.deepPurple,
      ),
    );
  }

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  _StatCard(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }
}

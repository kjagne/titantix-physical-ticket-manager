# Titantix Scanner - 100% Offline Ticket Validation

A Flutter mobile app for scanning and validating event tickets **completely offline**. Perfect for events with poor internet connectivity.

## 🎯 Features

- ✅ **100% Offline Operation** - Works without internet after initial sync
- ✅ **QR Code Scanning** - Fast and accurate ticket validation
- ✅ **Cryptographic Verification** - Detects counterfeit tickets
- ✅ **Local SQLite Database** - Stores all tickets on device
- ✅ **Duplicate Detection** - Prevents ticket reuse
- ✅ **Multi-Device Support** - Multiple phones can scan simultaneously
- ✅ **Sync When Online** - Upload used tickets when internet returns

## 🚀 How It Works

### **Offline Architecture**

```
1. BEFORE EVENT (Requires Internet):
   Web App → Generate Tickets → Save to IndexedDB
   ↓
   Mobile App → Sync/Download All Tickets → Save to SQLite
   
2. DURING EVENT (100% Offline):
   Scan QR Code → Verify Token Signature → Check Database → Mark as Used
   (All operations happen locally on the phone)
   
3. AFTER EVENT (When Internet Available):
   Mobile App → Upload Used Tickets → Web App Updates Database
```

### **Why It Works Offline**

1. **Pre-Sync**: All tickets are downloaded before the event
2. **Local Crypto**: Token verification happens on-device (no server needed)
3. **SQLite Storage**: All ticket data stored locally
4. **Offline Marking**: Tickets marked as "USED" in local database
5. **Later Sync**: Changes uploaded when internet returns

## 📱 Installation

### **Prerequisites**
- Flutter SDK (3.8.1 or higher)
- Android Studio / Xcode
- Physical device (camera required for QR scanning)

### **Setup**

```bash
# Navigate to the scanner app
cd titantix_scanner

# Install dependencies
flutter pub get

# Run on connected device
flutter run
```

## 🔧 Configuration

### **1. Set Your Server URL**

Edit `lib/screens/home_screen.dart`:

```dart
String _syncUrl = 'http://YOUR_SERVER_IP:3000';
```

Replace `YOUR_SERVER_IP` with your computer's local IP address.

### **2. Find Your Local IP**

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

Example: `http://192.168.1.100:3000`

## 📖 Usage Guide

### **Step 1: Sync Tickets (Before Event)**

1. Open the app
2. Tap **"SYNC TICKETS FROM SERVER"**
3. Wait for download to complete
4. Verify ticket count is correct

### **Step 2: Scan Tickets (During Event - Offline)**

1. Tap **"START SCANNING"**
2. Point camera at QR code
3. Wait for validation result:
   - ✅ **Green** = Valid ticket, check-in successful
   - ❌ **Red** = Invalid/Used/Counterfeit ticket
   - 🟠 **Orange** = Ticket not sold yet

### **Step 3: Upload Results (After Event)**

1. Connect to internet
2. Tap **"UPLOAD USED TICKETS"**
3. All offline scans sync to server

## 🔐 Security Features

### **Counterfeit Detection**

1. **Token Signature Verification**
   - Each QR code contains a cryptographically signed token
   - Signature verified using SHA-256 hash
   - Invalid signatures rejected immediately

2. **Database Lookup**
   - Serial number must exist in pre-synced database
   - Prevents fake tickets not in the system

3. **Status Checking**
   - UNSOLD tickets rejected
   - USED tickets show duplicate scan warning
   - Only SOLD tickets can be checked in

## 🔄 Multi-Device Sync Strategy

### **Problem**: Two phones scanning simultaneously

**Solution**: Each device tracks locally, sync later

```
Phone A (Offline) → Scans Ticket #123 → Marks USED in local DB
Phone B (Offline) → Scans Ticket #123 → Marks USED in local DB

Later (Online):
Phone A → Uploads: Ticket #123 used at 7:00 PM by GATE-A
Phone B → Uploads: Ticket #123 used at 7:01 PM by GATE-B

Server → Detects duplicate → Keeps first scan → Flags second as duplicate
```

### **Best Practice**:
- Assign each phone to a different gate
- Sync frequently when internet available
- Review duplicate reports after event

## 📊 Database Schema

### **Tickets Table (SQLite)**

```sql
CREATE TABLE tickets(
  serial TEXT PRIMARY KEY,           -- Unique serial (e.g., VIP-A7B3-K9M2-P4Q8)
  token TEXT NOT NULL,               -- Signed QR code token
  ticketTypeName TEXT NOT NULL,      -- VIP, Ordinary, etc.
  price INTEGER NOT NULL,            -- Ticket price
  status TEXT NOT NULL,              -- UNSOLD, SOLD, USED
  usedAt TEXT,                       -- Timestamp when scanned
  usedByDevice TEXT,                 -- Which phone scanned it
  synced INTEGER NOT NULL DEFAULT 1  -- 0 = needs upload, 1 = synced
)
```

## 🛠️ API Endpoints (Web App)

### **GET /api/tickets**
Download all tickets for offline use

**Response:**
```json
[
  {
    "serial": "VIP-A7B3-K9M2-P4Q8",
    "token": "eyJzIjoiVklQLUE3QjMtSzlNMi1QNFE4IiwiaWF0IjoxNzMwNjc...",
    "ticketTypeName": "VIP",
    "price": 100,
    "status": "SOLD"
  }
]
```

### **POST /api/tickets/sync**
Upload used tickets from offline scans

**Request:**
```json
{
  "tickets": [
    {
      "serial": "VIP-A7B3-K9M2-P4Q8",
      "status": "USED",
      "usedAt": "2025-11-03T20:30:00Z",
      "usedByDevice": "GATE-A7B3"
    }
  ]
}
```

## 📱 Permissions Required

### **Android** (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

### **iOS** (`ios/Runner/Info.plist`)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access required for scanning QR codes</string>
```

## 🐛 Troubleshooting

### **"No tickets in database"**
- Ensure you synced tickets before scanning
- Check server URL is correct
- Verify web app is running

### **"Sync failed"**
- Check internet connection
- Verify server IP address
- Ensure web app API is accessible

### **"Invalid QR Code"**
- QR code may be damaged
- Ensure it's a Titantix QR code
- Check lighting conditions

### **Camera not working**
- Grant camera permissions
- Restart the app
- Check device camera functionality

## 🎨 Customization

### **Change Theme Colors**

Edit `lib/main.dart`:
```dart
colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
```

### **Modify Scan Result Duration**

Edit `lib/screens/scanner_screen.dart`:
```dart
Future.delayed(Duration(seconds: 2), () { // Change duration here
```

## 📦 Dependencies

- `mobile_scanner: ^5.2.3` - QR code scanning
- `sqflite: ^2.3.3` - Local database
- `crypto: ^3.0.6` - Token verification
- `http: ^1.2.2` - Server communication
- `device_info_plus: ^11.1.1` - Device identification
- `shared_preferences: ^2.3.3` - Settings storage
- `connectivity_plus: ^6.1.1` - Network status

## 🚀 Building for Production

### **Android APK**
```bash
flutter build apk --release
```

### **iOS IPA**
```bash
flutter build ios --release
```

## 📝 License

This project is part of the Titantix Physical Ticket Manager system.

## 🤝 Support

For issues or questions, check the main Titantix repository.

# 🎫 Titantix System Architecture

## ✅ **Complete System Overview**

Your ticket management system now uses a **centralized server database** that works both online and offline!

### **System Components:**

```
┌─────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                       │
│              (React + TypeScript + Vite)                 │
│                  Port: 3000                              │
│                                                          │
│  • Generate Tickets                                      │
│  • Design Management                                     │
│  • Print Tickets                                         │
│  • View All Tickets                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ HTTP API Calls
                   ↓
┌─────────────────────────────────────────────────────────┐
│                   API SERVER                             │
│              (Node.js + Express)                         │
│                  Port: 4000                              │
│                                                          │
│  Endpoints:                                              │
│  • POST /api/tickets/bulk  - Save tickets                │
│  • GET  /api/tickets       - Get all tickets             │
│  • POST /api/tickets/sync  - Update used tickets         │
│  • GET  /api/stats         - Get statistics              │
│  • POST /api/designs       - Save designs                │
│  • GET  /api/designs       - Get designs                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ SQLite Operations
                   ↓
┌─────────────────────────────────────────────────────────┐
│               SERVER DATABASE                            │
│                (SQLite File)                             │
│             titantix.db                                  │
│                                                          │
│  Tables:                                                 │
│  • tickets   - All generated tickets                     │
│  • designs   - Saved ticket designs                      │
│  • batches   - Print batch tracking                      │
└─────────────────┬───────────────────────────────────────┘
                   │
                   │ HTTP Sync
                   ↓
┌─────────────────────────────────────────────────────────┐
│              FLUTTER MOBILE APP                          │
│            (Android/iOS Scanner)                         │
│                                                          │
│  Features:                                               │
│  • Download tickets from server                          │
│  • Store in local SQLite                                 │
│  • Scan QR codes 100% offline                            │
│  • Upload used tickets when online                       │
└─────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow:**

### **1. Generate Tickets (Web App)**
```
User clicks "Generate Tickets"
    ↓
Web App creates tickets with QR codes
    ↓
Sends to API Server (POST /api/tickets/bulk)
    ↓
Saved to titantix.db
```

### **2. Sync to Mobile (Flutter App)**
```
User taps "SYNC TICKETS FROM SERVER"
    ↓
Flutter App requests tickets (GET /api/tickets)
    ↓
API Server reads from titantix.db
    ↓
Flutter App saves to phone SQLite
    ↓
Ready for offline scanning!
```

### **3. Scan Tickets (Offline)**
```
User scans QR code
    ↓
Flutter App verifies token (offline)
    ↓
Checks phone SQLite database (offline)
    ↓
Marks as USED in phone database (offline)
    ↓
Shows result instantly
```

### **4. Upload Used Tickets (When Online)**
```
User taps "UPLOAD USED TICKETS"
    ↓
Flutter App sends used tickets (POST /api/tickets/sync)
    ↓
API Server updates titantix.db
    ↓
Server database now has latest status
```

## 📊 **Database Schema:**

### **Server Database (titantix.db)**

```sql
CREATE TABLE tickets (
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

CREATE TABLE designs (
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

CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  batchId TEXT NOT NULL UNIQUE,
  ticketCount INTEGER NOT NULL,
  designId TEXT,
  createdAt TEXT NOT NULL
);
```

## 🚀 **Deployment Ready:**

This system can now be hosted on:
- ✅ **Render.com** (Free tier)
- ✅ **Railway.app**
- ✅ **DigitalOcean**
- ✅ **Fly.io**
- ✅ **Any VPS with Node.js**

### **What Gets Deployed:**
1. **Web App** - Static files (can use Netlify/Vercel)
2. **API Server** - Node.js app with SQLite database
3. **Flutter App** - Compiled APK/IPA for phones

### **Database File:**
- `titantix.db` is created automatically on first run
- Persists all data even after server restarts
- Can be backed up easily (just copy the file!)

## 🔐 **Security Features:**

1. **Cryptographic QR Codes** - SHA-256 signed tokens
2. **Token Verification** - Prevents counterfeits
3. **Serial Number Validation** - Must exist in database
4. **Status Checking** - Prevents duplicate scans
5. **Device Tracking** - Records which phone scanned each ticket

## 📱 **Offline Capabilities:**

### **Web App:**
- ❌ Requires internet (connects to API server)

### **Flutter App:**
- ✅ **100% offline scanning** after initial sync
- ✅ Stores all tickets locally
- ✅ Verifies tokens without internet
- ✅ Marks tickets as used offline
- ✅ Syncs back when online

## 🎯 **Usage Workflow:**

### **Before Event:**
1. Generate tickets in web app
2. Tickets saved to server database
3. Sync tickets to all scanner phones
4. Verify all phones have tickets

### **During Event:**
1. Turn off internet on phones (optional)
2. Scan tickets at gates
3. Instant validation
4. No network needed!

### **After Event:**
1. Connect phones to internet
2. Upload used tickets
3. Server database updated
4. Generate reports from server database

## 📦 **Files Structure:**

```
titantix-physical-ticket-manager/
├── server.js                    # API Server
├── server-db.js                 # Database operations
├── titantix.db                  # SQLite database (created automatically)
├── services/
│   ├── api-database.ts          # Web app API client
│   └── ticketService.ts         # QR code generation
├── hooks/
│   ├── useTicketManager.ts      # Ticket management
│   └── useDesignManager.ts      # Design management
└── titantix_scanner/            # Flutter mobile app
    ├── lib/
    │   ├── services/
    │   │   ├── database_service.dart    # Phone SQLite
    │   │   └── crypto_service.dart      # Token verification
    │   └── screens/
    │       ├── home_screen.dart         # Sync screen
    │       └── scanner_screen.dart      # QR scanner
    └── README.md                # Flutter app documentation
```

## ✅ **System Status:**

- ✅ Web app generates tickets
- ✅ Server database stores tickets
- ✅ Flutter app syncs tickets
- ✅ Offline scanning works
- ✅ Token verification works
- ✅ Multi-device support
- ✅ Ready for deployment

## 🎉 **You're All Set!**

Your system is now production-ready with a centralized database that can be hosted online!

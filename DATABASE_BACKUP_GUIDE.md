# Database Backup & Restore Guide

## Overview

The Database Management feature allows you to backup and restore all your ticket data, preventing data loss and enabling easy data migration.

## Features

### 1. **Export Database (Download Backup)**
- Downloads all your data as a JSON file
- Includes:
  - All tickets (serial numbers, tokens, status, etc.)
  - All saved designs
  - All batch information
- File naming: `titantix-backup-YYYY-MM-DD.json`

### 2. **Import Database (Upload Backup)**
- Restores data from a previously exported backup file
- Adds to existing data (does not overwrite)
- Processes in batches to avoid memory issues
- Shows import summary after completion

### 3. **Clear Database**
- Permanently deletes ALL data
- Requires double confirmation
- Use with caution!

## How to Use

### Exporting Your Database

1. Click **"Database"** in the top navigation
2. Click **"📥 Download Backup"** button
3. A JSON file will be downloaded to your computer
4. Save this file in a safe location

**When to Export:**
- Before generating large batches (>1000 tickets)
- At the end of each event
- Weekly as a regular backup
- Before clearing or modifying data

### Importing a Backup

1. Click **"Database"** in the top navigation
2. Click **"📤 Upload Backup"** button
3. Select your backup JSON file
4. Wait for the import to complete
5. You'll see a summary of imported data

**Important Notes:**
- Import adds to existing data (duplicates may occur if you import the same file twice)
- Large backups may take a few minutes to import
- Don't close the browser during import

### Clearing the Database

1. Click **"Database"** in the top navigation
2. Scroll to the **"⚠️ Danger Zone"** section
3. Click **"🗑️ Clear All Data"**
4. Confirm twice (this action cannot be undone!)
5. Page will reload with empty database

## Backup File Format

The backup file is a JSON file with the following structure:

```json
{
  "version": 1,
  "exportDate": "2025-11-05T14:30:00.000Z",
  "data": {
    "tickets": [
      {
        "serial": "TIX-XXXX-XXXX-XXXX",
        "token": "...",
        "ticketTypeName": "VIP",
        "price": 1000,
        "status": "AVAILABLE",
        ...
      }
    ],
    "designs": [
      {
        "id": "...",
        "name": "Concert Design",
        "backgroundImageUrl": "...",
        ...
      }
    ],
    "batches": [
      {
        "id": "...",
        "batchId": "...",
        "ticketCount": 100,
        ...
      }
    ]
  }
}
```

## Best Practices

### Regular Backups
- **Daily**: If generating tickets daily
- **Weekly**: For regular operations
- **Before Major Events**: Always backup before generating large batches

### Backup Storage
- Keep backups in multiple locations:
  - Local computer
  - Cloud storage (Google Drive, Dropbox, etc.)
  - External hard drive
- Name backups with dates for easy identification
- Keep at least 3 recent backups

### Data Recovery
1. If you lose data, find your most recent backup
2. Go to Database → Upload Backup
3. Select the backup file
4. Verify the imported data

## Troubleshooting

### Export Failed
- **Cause**: Browser memory issues or large database
- **Solution**: Try exporting from a different browser or clear some old tickets first

### Import Failed
- **Cause**: Invalid file format or corrupted backup
- **Solution**: 
  - Verify the file is a valid JSON file
  - Try opening it in a text editor to check format
  - Use a different backup file

### Slow Import
- **Cause**: Large backup file (>10,000 tickets)
- **Solution**: 
  - Be patient, it processes in batches
  - Don't close the browser
  - Import may take 5-10 minutes for very large files

### Duplicate Data After Import
- **Cause**: Importing the same backup multiple times
- **Solution**:
  - Clear database before importing if you want to replace data
  - Or manually delete duplicates

## File Size Estimates

| Tickets | Approximate File Size |
|---------|----------------------|
| 100     | ~50 KB              |
| 1,000   | ~500 KB             |
| 10,000  | ~5 MB               |
| 100,000 | ~50 MB              |

## Security Notes

- Backup files contain sensitive ticket data (tokens, serials)
- Store backups securely
- Don't share backup files publicly
- Consider encrypting backup files for sensitive events

## Technical Details

### Storage
- Uses IndexedDB for local browser storage
- No data sent to external servers
- All data stays on your device

### Export Process
1. Retrieves all data from IndexedDB
2. Converts to JSON format
3. Creates downloadable blob
4. Triggers browser download

### Import Process
1. Reads JSON file
2. Validates format
3. Imports in batches of 100 tickets
4. Shows progress and summary

## API Methods

For developers integrating backup functionality:

```typescript
// Export database
const jsonData = await db.exportDatabase();

// Import database
const result = await db.importDatabase(jsonData);
console.log(`Imported ${result.tickets} tickets`);

// Download backup
await db.downloadBackup();

// Clear all data
await db.clearAllData();
```

## Support

If you encounter issues with backup/restore:
1. Check browser console for error messages
2. Verify backup file is valid JSON
3. Try with a smaller backup file
4. Contact support with error details

## Version History

- **v1.0** (2025-11-05): Initial release
  - Export database
  - Import database
  - Clear database
  - Batch processing for large imports

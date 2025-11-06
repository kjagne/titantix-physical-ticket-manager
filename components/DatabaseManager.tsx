import React, { useState } from 'react';
import { db } from '../services/api-database';

export const DatabaseManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ tickets: number; designs: number; batches: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      await db.downloadBackup();
      alert('Database backup downloaded successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export database. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setImportResult(null);

      const text = await file.text();
      const result = await db.importDatabase(text);
      setImportResult(result);
      alert(`Successfully imported:\n- ${result.tickets} tickets\n- ${result.designs} designs\n- ${result.batches} batches`);
    } catch (err) {
      console.error('Import failed:', err);
      setError('Failed to import database. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL tickets, designs, and batches. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!window.confirm('Are you ABSOLUTELY sure? All data will be permanently deleted!')) {
      return;
    }

    try {
      await db.clearAllData();
      alert('Database cleared successfully!');
      window.location.reload();
    } catch (err) {
      console.error('Clear failed:', err);
      setError('Failed to clear database. Please try again.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">💾 Database Management</h2>
      <p className="text-gray-300 mb-6">
        Backup your tickets and data to prevent loss. You can export your database and import it later.
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {importResult && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Import Successful!</p>
          <ul className="mt-2 text-sm">
            <li>✅ {importResult.tickets} tickets imported</li>
            <li>✅ {importResult.designs} designs imported</li>
            <li>✅ {importResult.batches} batches imported</li>
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {/* Export Database */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">📥 Export Database</h3>
          <p className="text-gray-300 text-sm mb-3">
            Download a backup file containing all your tickets, designs, and batches.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            {isExporting ? '⏳ Exporting...' : '📥 Download Backup'}
          </button>
        </div>

        {/* Import Database */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">📤 Import Database</h3>
          <p className="text-gray-300 text-sm mb-3">
            Restore data from a previously exported backup file. This will add to existing data.
          </p>
          <label className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors cursor-pointer inline-block">
            {isImporting ? '⏳ Importing...' : '📤 Upload Backup'}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>

        {/* Clear Database */}
        <div className="bg-gray-700 rounded-lg p-4 border-2 border-red-500/50">
          <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Danger Zone</h3>
          <p className="text-gray-300 text-sm mb-3">
            Permanently delete all data from the database. This action cannot be undone!
          </p>
          <button
            onClick={handleClearDatabase}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">📋 Instructions</h3>
        <ul className="text-gray-300 text-sm space-y-2">
          <li><strong>Export:</strong> Creates a JSON file with all your data. Save this file safely!</li>
          <li><strong>Import:</strong> Restores data from a backup file. Existing data is preserved.</li>
          <li><strong>Best Practice:</strong> Export your database regularly, especially before generating large batches.</li>
          <li><strong>File Format:</strong> Backup files are in JSON format and can be opened with any text editor.</li>
        </ul>
      </div>
    </div>
  );
};

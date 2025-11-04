
import React, { useState, useRef } from 'react';
import { Ticket, TicketStatus } from '../types';

interface GateScannerProps {
  scanTicket: (serial: string) => Promise<{ success: boolean; message: string; ticket?: Ticket }>;
}

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
}

const StatusIndicator: React.FC<{ result: ScanResult | null }> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <p className="mt-4 text-gray-500">Ready to scan...</p>
      </div>
    );
  }

  if (result.success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold text-green-400 mt-4">Access Granted</h3>
        <p className="text-gray-400">{result.message}</p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold text-red-400 mt-4">Access Denied</h3>
        <p className="text-gray-400">{result.message}</p>
      </div>
    );
  }
};


export const GateScanner: React.FC<GateScannerProps> = ({ scanTicket }) => {
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial) return;
    const scanResult = await scanTicket(serial);
    setResult(scanResult);
    setSerial('');
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gate Scanner</h2>
          <p className="text-gray-400 mb-6">Simulates QR code scan at the event gate for validation.</p>

          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
            <form onSubmit={handleSubmit}>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Ticket Serial / QR Payload</label>
              <input
                ref={inputRef}
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Scan or type serial..."
                className="w-full bg-gray-700 text-white rounded-md p-3 font-mono tracking-wider border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors shadow-lg"
                disabled={!serial}
              >
                Scan
              </button>
            </form>
          </div>

          {result?.ticket && (
             <div className="mt-6 p-4 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 space-y-2">
                <h4 className="font-bold text-white">Last Scanned Ticket Details</h4>
                <div className="flex justify-between">
                  <span>Serial:</span><span className="font-mono">{result.ticket.serial}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span><span>{result.ticket.ticketTypeName}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Status:</span><span className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>{result.ticket.status}</span>
                </div>
                {result.ticket.soldAt && <div className="flex justify-between">
                  <span>Sold At:</span><span>{new Date(result.ticket.soldAt).toLocaleString()}</span>
                </div>}
                {result.ticket.usedAt && <div className="flex justify-between">
                  <span>Used At:</span><span>{new Date(result.ticket.usedAt).toLocaleString()}</span>
                </div>}
              </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 min-h-[300px]">
           <StatusIndicator result={result} />
        </div>
      </div>
    </div>
  );
};

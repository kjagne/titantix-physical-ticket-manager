
import React, { useState, useRef } from 'react';
import { Ticket, TicketStatus } from '../types';

interface BoxOfficeProps {
  sellTicket: (serial: string) => { success: boolean; message: string; ticket?: Ticket };
}

interface SaleResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
}

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = 'px-3 py-1 text-sm font-medium rounded-full';
  const statusClasses = {
    [TicketStatus.UNSOLD]: 'bg-gray-600 text-gray-200',
    [TicketStatus.SOLD]: 'bg-green-600 text-green-100',
    [TicketStatus.USED]: 'bg-yellow-600 text-yellow-100',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};


export const BoxOffice: React.FC<BoxOfficeProps> = ({ sellTicket }) => {
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState<SaleResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial) return;
    const saleResult = sellTicket(serial);
    setResult(saleResult);
    setSerial('');
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-2">Box Office Point-of-Sale</h2>
        <p className="text-gray-400 mb-6">Enter a ticket serial number to mark it as sold.</p>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g., VIP-A1B2-C3D4-E5F6"
              className="flex-grow bg-gray-700 text-white rounded-md p-3 font-mono tracking-wider border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors shadow-lg"
              disabled={!serial}
            >
              Sell Ticket
            </button>
          </form>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg animate-fade-in border ${
              result.success ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'
            }`}
          >
            <p className={result.success ? 'text-green-300' : 'text-red-300'}>{result.message}</p>
            {result.ticket && (
              <div className="mt-4 border-t border-gray-700 pt-4 text-gray-300 space-y-2">
                <div className="flex justify-between">
                  <span>Serial:</span><span className="font-mono">{result.ticket.serial}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span><span>{result.ticket.ticketTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span><span>D{result.ticket.price.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span>Previous Status:</span><StatusBadge status={TicketStatus.UNSOLD} />
                </div>
                <div className="flex justify-between items-center">
                  <span>New Status:</span><StatusBadge status={TicketStatus.SOLD} />
                </div>
                <div className="flex justify-between">
                  <span>Sold At:</span><span>{new Date(result.ticket.soldAt!).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


import React from 'react';
import { Ticket } from '../types';
import { TicketView } from './TicketView';

interface TicketPrintLayoutProps {
  tickets: Ticket[];
  backgroundImageUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  pageIndex?: number;
  onPrintPage?: (pageIndex: number) => void;
}

export const TicketPrintLayout: React.FC<TicketPrintLayoutProps> = ({ 
  tickets, 
  backgroundImageUrl,
  imageScale = 100,
  imagePositionX = 50,
  imagePositionY = 50,
  pageIndex,
  onPrintPage
}) => {
  if (tickets.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-2xl font-bold text-gray-200">Generated Tickets for Printing</h2>
        <button
          onClick={() => {
            if (pageIndex !== undefined && onPrintPage) {
              onPrintPage(pageIndex);
            } else {
              window.print();
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Print Batch
        </button>
      </div>

      <style>
        {`
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          @media print {
            html, body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
            .printable-page {
              page-break-after: always;
              width: 210mm !important;
              height: 297mm !important;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 5mm 10mm !important;
              gap: 8mm;
              box-sizing: border-box;
              margin: 0 !important;
            }
            .ticket-container {
              width: 190mm !important;
              height: 60mm !important;
              margin: 0 !important;
              flex-shrink: 0;
            }
          }
          @media screen {
            .printable-page {
              width: 210mm;
              height: 297mm;
              margin: 0 auto 20px;
              padding: 15mm 10mm;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              gap: 8mm;
              box-sizing: border-box;
            }
            .ticket-container {
              width: 190mm;
              height: 60mm;
              margin: 0;
              flex-shrink: 0;
            }
          }
        `}
      </style>

      {Array.from({ length: Math.ceil(tickets.length / 4) }).map((_, pageIndex) => (
        <div key={pageIndex} className="printable-page">
          {tickets.slice(pageIndex * 4, pageIndex * 4 + 4).map((ticket) => (
            <div key={ticket.serial} className="ticket-container">
              <TicketView 
                ticket={ticket} 
                backgroundImageUrl={backgroundImageUrl}
                imageScale={imageScale}
                imagePositionX={imagePositionX}
                imagePositionY={imagePositionY}
                stubColor={ticket.stubColor || '#F3F1EC'}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

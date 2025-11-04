
import React from 'react';
import { Ticket } from '../types';

interface TicketViewProps {
  ticket: Ticket;
  backgroundImageUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  stubColor?: string;
}

// A more visually appealing ticket design inspired by the user's image.
export const TicketView: React.FC<TicketViewProps> = ({ 
  ticket, 
  backgroundImageUrl,
  imageScale = 100,
  imagePositionX = 50,
  imagePositionY = 50,
  stubColor = '#F3F1EC'
}) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.token)}&qzone=1`;
  // Using a more robust barcode generator that doesn't place text below
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${ticket.serial.replace(/-/g, '')}&scale=2&height=10&includetext=false`;
  
  // Placeholder data to match the design, as this is not in the Ticket type
  const eventDetails = { gate: '12', row: '07', seat: '35' };
  const defaultConcertImageUrl = "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";
  const finalImageUrl = backgroundImageUrl || defaultConcertImageUrl;

  return (
    <div className="bg-gray-900 flex font-sans aspect-[3/1] rounded-2xl shadow-lg relative overflow-hidden w-full h-full">
      <style>{`
        .ticket-vertical-text {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        @media print {
          .ticket-vertical-text {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
        {/* Main image part (Left) */}
        <div 
            className="flex-grow relative overflow-hidden bg-gray-800 flex items-center justify-start pl-6" 
            style={{ 
              backgroundImage: `url(${finalImageUrl})`,
              backgroundSize: `${imageScale}%`,
              backgroundPosition: `${imagePositionX}% ${imagePositionY}%`,
              backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent"></div>
            
            {/* Vertical Text on Left Side */}
            <div className="relative z-10 h-full flex items-center">
              <h2 className="ticket-vertical-text text-base font-semibold text-white drop-shadow-2xl tracking-wide whitespace-nowrap" 
                 style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                Misma la diva
              </h2>
              <h2 className="ticket-vertical-text text-base font-semibold text-white drop-shadow-2xl tracking-wide whitespace-nowrap" 
                 style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                Nana Jiguela (Believe)
              </h2>
            </div>
            
            {/* Ticket Info at Bottom Right */}
            <div className="absolute bottom-4 right-4 z-10">
              <div className="bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-md">
                <p className="text-sm text-white font-semibold">
                  {ticket.ticketTypeName} • GMD {ticket.price}
                </p>
              </div>
            </div>
        </div>

        {/* Perforated line effect */}
        <div className="absolute top-0 bottom-0 left-[calc(100%-12rem)] w-px bg-repeat-y" 
             style={{backgroundImage: 'linear-gradient(to bottom, white 5px, transparent 5px)', backgroundSize: '1px 10px'}}>
        </div>
        
        {/* Top cutout */}
        <div className="absolute top-[-12px] left-[calc(100%-12rem-12px)] w-6 h-6 rounded-full bg-gray-900 z-20"></div>
        {/* Bottom cutout */}
        <div className="absolute bottom-[-12px] left-[calc(100%-12rem-12px)] w-6 h-6 rounded-full bg-gray-900 z-20"></div>


        {/* Stub part (Right) with QR Code */}
        <div className="text-black w-48 p-4 flex flex-row justify-between items-center shrink-0" style={{ backgroundColor: stubColor }}>
            {/* QR Code - Larger for scanning */}
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="bg-white p-2 rounded-xl shadow-2xl">
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            </div>
            
            {/* Serial Number (Vertical) - Pushed to right edge */}
            <div className="flex items-center ml-2">
              <p className="ticket-vertical-text text-[11px] font-mono font-bold text-gray-900 tracking-wide" 
                 style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                {ticket.serial}
              </p>
            </div>
        </div>
    </div>
  );
};

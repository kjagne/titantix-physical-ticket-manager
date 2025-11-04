import React, { useState } from 'react';
import { Ticket } from '../types';
import { TicketPrintLayout } from './TicketPrintLayout';
import { generateTicketsPDF, generateSinglePagePDF } from '../utils/pdfGenerator';

interface AllTicketsViewProps {
  tickets: Ticket[];
  backgroundImageUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  onBack: () => void;
}

export const AllTicketsView: React.FC<AllTicketsViewProps> = ({
  tickets,
  backgroundImageUrl,
  imageScale,
  imagePositionX,
  imagePositionY,
  onBack,
}) => {
  const totalPages = Math.ceil(tickets.length / 4);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadAllPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateTicketsPDF(
        tickets,
        backgroundImageUrl,
        imageScale,
        imagePositionX,
        imagePositionY
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPagePDF = async (pageIndex: number) => {
    const pageElement = document.getElementById(`page-${pageIndex}`);
    if (!pageElement) return;

    setIsGeneratingPDF(true);
    try {
      await generateSinglePagePDF(pageElement);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintSinglePage = (pageIndex: number) => {
    // Hide all pages except the one we want to print
    const allPages = document.querySelectorAll('.page-break');
    allPages.forEach((page, index) => {
      const pageElement = page as HTMLElement;
      if (index !== pageIndex) {
        pageElement.style.display = 'none';
      }
    });

    // Print
    window.print();

    // Restore all pages after printing
    setTimeout(() => {
      allPages.forEach((page) => {
        const pageElement = page as HTMLElement;
        pageElement.style.display = '';
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Generator
              </button>
              <div>
                <h1 className="text-2xl font-bold">All Generated Tickets</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {tickets.length} tickets • {totalPages} pages
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Print to printer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No Tickets Yet</h2>
            <p className="text-gray-500">Generate your first batch to see tickets here!</p>
            <button
              onClick={onBack}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Go to Generator
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Group tickets into pages of 4 */}
            {Array.from({ length: totalPages }, (_, pageIndex) => {
              const pageTickets = tickets.slice(pageIndex * 4, (pageIndex + 1) * 4);
              return (
                <div key={pageIndex} className="page-break">
                  {/* Page actions */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <span className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-semibold">
                        Page {pageIndex + 1} of {totalPages}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Tickets {pageIndex * 4 + 1} - {Math.min((pageIndex + 1) * 4, tickets.length)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePrintSinglePage(pageIndex)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors print:hidden"
                    >
                      🖨️ Print This Page
                    </button>
                  </div>
                  
                  {/* A4 Page with 4 tickets */}
                  <div id={`page-${pageIndex}`} data-page={pageIndex}>
                    <TicketPrintLayout
                      tickets={pageTickets}
                      backgroundImageUrl={backgroundImageUrl}
                      imageScale={imageScale}
                      imagePositionX={imagePositionX}
                      imagePositionY={imagePositionY}
                      pageIndex={pageIndex}
                      onPrintPage={handlePrintSinglePage}
                    />
                  </div>

                  {/* Page Divider */}
                  {pageIndex < totalPages - 1 && (
                    <div className="mt-12 border-t-2 border-dashed border-gray-700 print:hidden"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Remove all margins and padding */
          * {
            margin: 0 !important;
            padding: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Remove dark background from main container */
          .min-h-screen.bg-gray-900 {
            background: white !important;
            min-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide header and page info when printing */
          .bg-gray-800.border-b.border-gray-700 {
            display: none !important;
          }
          .flex.items-center.justify-between.mb-6 {
            display: none !important;
          }
          .max-w-7xl.mx-auto.px-6.py-8 {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .space-y-12 {
            gap: 0 !important;
            margin: 0 !important;
          }
          .page-break {
            page-break-after: always;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break:last-child {
            page-break-after: auto;
          }
          /* Ensure printable pages have no extra spacing */
          #page-0, #page-1, #page-2, #page-3, #page-4, #page-5, #page-6, #page-7, #page-8, #page-9 {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

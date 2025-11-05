import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { TicketPrintLayout } from './TicketPrintLayout';
import { generateTicketsPDF, generateSinglePagePDF } from '../utils/pdfGenerator';
import { db } from '../services/api-database';

interface AllTicketsViewPaginatedProps {
  ticketCount: number;
  backgroundImageUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
  onBack: () => void;
}

export const AllTicketsViewPaginated: React.FC<AllTicketsViewPaginatedProps> = ({
  ticketCount,
  backgroundImageUrl,
  imageScale,
  imagePositionX,
  imagePositionY,
  onBack,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const TICKETS_PER_PAGE = 100; // Load 100 tickets at a time

  // Load tickets for current page
  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      try {
        const result = await db.getTicketsPaginated(currentPage, TICKETS_PER_PAGE);
        setTickets(result.tickets);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTickets();
  }, [currentPage]);

  const handleDownloadPagePDF = async () => {
    if (tickets.length === 0) return;
    
    setIsGeneratingPDF(true);
    setPdfProgress({ current: 0, total: tickets.length });
    try {
      await generateTicketsPDF(
        tickets,
        backgroundImageUrl,
        imageScale,
        imagePositionX,
        imagePositionY,
        (current, total) => setPdfProgress({ current, total })
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(null);
    }
  };

  const handleDownloadAllPDF = async () => {
    const estimatedTime = Math.ceil(ticketCount / 100); // Rough estimate: 100 tickets per second
    if (!window.confirm(`This will download ALL ${ticketCount} tickets as a PDF. Estimated time: ~${estimatedTime} seconds. Continue?`)) {
      return;
    }

    setIsGeneratingPDF(true);
    setPdfProgress({ current: 0, total: ticketCount });
    try {
      // Load all tickets in batches and generate PDF
      const allTickets: Ticket[] = [];
      const totalPagesToLoad = Math.ceil(ticketCount / TICKETS_PER_PAGE);
      
      for (let page = 1; page <= totalPagesToLoad; page++) {
        const result = await db.getTicketsPaginated(page, TICKETS_PER_PAGE);
        allTickets.push(...result.tickets);
        
        // Show loading progress
        setPdfProgress({ current: allTickets.length, total: ticketCount * 2 }); // First half is loading
        console.log(`Loading tickets: ${allTickets.length}/${ticketCount}`);
      }
      
      await generateTicketsPDF(
        allTickets,
        backgroundImageUrl,
        imageScale,
        imagePositionX,
        imagePositionY,
        (current, total) => {
          // Second half is PDF generation
          setPdfProgress({ current: ticketCount + current, total: ticketCount * 2 });
        }
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress(null);
    }
  };

  const printPages = Math.ceil(tickets.length / 4);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">All Tickets</h2>
            <p className="text-gray-400 mt-1">
              Showing {tickets.length} tickets (Page {currentPage} of {totalPages})
            </p>
            <p className="text-sm text-gray-500">
              Total: {ticketCount} tickets • {printPages} print pages on this page
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPagePDF}
              disabled={isGeneratingPDF || tickets.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isGeneratingPDF && pdfProgress ? 
                `⏳ ${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%` : 
                '📄 Download This Page as PDF'}
            </button>
            <button
              onClick={handleDownloadAllPDF}
              disabled={isGeneratingPDF}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              {isGeneratingPDF && pdfProgress ? 
                `⏳ ${Math.round((pdfProgress.current / pdfProgress.total) * 100)}%` : 
                '📦 Download ALL Tickets as PDF'}
            </button>
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* PDF Generation Progress */}
        {isGeneratingPDF && pdfProgress && (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Generating PDF...</span>
              <span className="text-sm font-semibold text-blue-400">
                {Math.round((pdfProgress.current / pdfProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(pdfProgress.current / pdfProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {pdfProgress.current <= ticketCount ? 
                `Loading tickets: ${pdfProgress.current}/${ticketCount}` :
                `Generating PDF: ${pdfProgress.current - ticketCount}/${pdfProgress.total - ticketCount} pages`
              }
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-4 mb-6 bg-gray-800 p-4 rounded-lg">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
          >
            « First
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
          >
            ‹ Previous
          </button>
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
          >
            Next ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
          >
            Last »
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading tickets...</p>
          </div>
        )}

        {/* Tickets Display */}
        {!isLoading && tickets.length > 0 && (
          <div className="space-y-8">
            {Array.from({ length: printPages }, (_, pageIndex) => {
              const startIdx = pageIndex * 4;
              const pageTickets = tickets.slice(startIdx, startIdx + 4);
              
              return (
                <div key={pageIndex} id={`page-${pageIndex}`} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      Print Page {pageIndex + 1} of {printPages}
                    </h3>
                    <span className="text-sm text-gray-400">
                      Tickets {startIdx + 1}-{Math.min(startIdx + 4, tickets.length)}
                    </span>
                  </div>
                  <TicketPrintLayout
                    tickets={pageTickets}
                    backgroundImageUrl={backgroundImageUrl}
                    imageScale={imageScale}
                    imagePositionX={imagePositionX}
                    imagePositionY={imagePositionY}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tickets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No tickets found on this page.</p>
          </div>
        )}

        {/* Bottom Pagination */}
        {!isLoading && tickets.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6 bg-gray-800 p-4 rounded-lg">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              « First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              ‹ Previous
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              Last »
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

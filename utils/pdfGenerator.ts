import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Ticket } from '../types';

export const generateTicketsPDF = async (
  tickets: Ticket[],
  backgroundImageUrl?: string,
  imageScale?: number,
  imagePositionX?: number,
  imagePositionY?: number
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalPages = Math.ceil(tickets.length / 4);
  let isFirstPage = true;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const pageTickets = tickets.slice(pageIndex * 4, (pageIndex + 1) * 4);
    
    // Find the actual page element from the DOM
    const pageElements = document.querySelectorAll('.printable-page');
    const pageElement = pageElements[pageIndex] as HTMLElement;
    
    if (pageElement) {
      // Convert to canvas with proper A4 dimensions
      // A4 at 300 DPI: 2480 x 3508 pixels
      // We'll use a scale that gives us good quality
      const canvas = await html2canvas(pageElement, {
        scale: 3, // Higher quality for print
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
        windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
      });

      // Add new page if not first
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Add canvas to PDF at full A4 size
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 dimensions in mm
    }
  }

  // Download the PDF
  const fileName = `Titantix_Tickets_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

const createTicketPageHTML = async (
  tickets: Ticket[],
  backgroundImageUrl?: string,
  imageScale?: number,
  imagePositionX?: number,
  imagePositionY?: number
): Promise<string> => {
  // This creates a simple HTML representation of 4 tickets in a 2x2 grid
  const ticketHTML = tickets.map(ticket => `
    <div style="
      width: 45%;
      height: 45%;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      margin: 5px;
      background: white;
      display: inline-block;
      vertical-align: top;
      box-sizing: border-box;
    ">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">
        ${ticket.ticketTypeName}
      </div>
      <div style="font-size: 10px; color: #666; margin-bottom: 4px;">
        ${ticket.serial}
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #2563eb;">
        GMD ${ticket.price}
      </div>
      <div style="margin-top: 10px; text-align: center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.token)}" 
             style="width: 100px; height: 100px;" />
      </div>
    </div>
  `).join('');

  return `
    <div style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      align-content: space-around;
    ">
      ${ticketHTML}
    </div>
  `;
};

export const generateSinglePagePDF = async (pageElement: HTMLElement): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Find the actual printable-page element within the wrapper
  const printablePage = pageElement.querySelector('.printable-page') as HTMLElement;
  const elementToCapture = printablePage || pageElement;

  const canvas = await html2canvas(elementToCapture, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
    windowHeight: 1123, // A4 height in pixels at 96 DPI (297mm)
  });

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

  const fileName = `Titantix_Page_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

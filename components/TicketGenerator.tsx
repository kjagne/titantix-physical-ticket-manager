
// FIX: Corrected the import statement for React and useState. This resolves all reported errors in this file.
import React, { useState } from 'react';
import { TicketTypeInfo, Ticket, TicketStatus } from '../types';
import { TicketPrintLayout } from './TicketPrintLayout';
import { TicketView } from './TicketView';
import { useDesignManager } from '../hooks/useDesignManager';
import { Toast } from './Toast';
import { AllTicketsView } from './AllTicketsView';


interface TicketGeneratorProps {
  generateTickets: (ticketTypes: TicketTypeInfo[]) => Promise<void>;
  lastGeneratedBatch: Ticket[];
  allTickets: Ticket[];
  deleteTicket: (serial: string) => Promise<void>;
  deleteAllTickets: () => Promise<void>;
  backgroundImageUrl?: string;
  imageScale?: number;
  imagePositionX?: number;
  imagePositionY?: number;
}

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
</svg>
);

const ImageIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


export const TicketGenerator: React.FC<TicketGeneratorProps> = ({ 
  generateTickets, 
  lastGeneratedBatch, 
  allTickets, 
  deleteTicket,
  deleteAllTickets,
  backgroundImageUrl: propBackgroundImageUrl,
  imageScale: propImageScale,
  imagePositionX: propImagePositionX,
  imagePositionY: propImagePositionY
}) => {
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInfo[]>([
    { id: `type-${Date.now()}`, name: 'Ordinary', quantity: 20, price: 50, stubColor: '#F3F1EC' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [imageScale, setImageScale] = useState<number>(100);
  const [imagePositionX, setImagePositionX] = useState<number>(50);
  const [imagePositionY, setImagePositionY] = useState<number>(50);
  const [designName, setDesignName] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  const { designs, saveDesign, loadDesign, deleteDesign } = useDesignManager();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };


  const handleAddType = () => {
    setTicketTypes([...ticketTypes, { id: `type-${Date.now()}`, name: '', quantity: 10, price: 100, stubColor: '#F3F1EC' }]);
  };

  const handleRemoveType = (id: string) => {
    setTicketTypes(ticketTypes.filter(t => t.id !== id));
  };

  const handleUpdateType = (id: string, field: keyof TicketTypeInfo, value: string | number) => {
    setTicketTypes(
      ticketTypes.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleGenerateClick = async () => {
     setIsLoading(true);
     try {
       await generateTickets(ticketTypes);
       const totalTickets = ticketTypes.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
       showToast(`✓ ${totalTickets} tickets generated and saved to database with unique QR codes!`, 'success');
     } catch (error) {
       showToast('Failed to generate tickets', 'error');
     }
     setIsLoading(false);
  }
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      alert('Please enter a design name');
      return;
    }
    try {
      await saveDesign(
        designName,
        backgroundImageUrl,
        imageScale,
        imagePositionX,
        imagePositionY,
        ticketTypes
      );
      showToast(`Design "${designName}" saved to database!`, 'success');
      setShowSaveDialog(false);
      setDesignName('');
    } catch (error) {
      showToast('Failed to save design', 'error');
    }
  };

  const handleLoadDesign = async (designId: string) => {
    try {
      const design = await loadDesign(designId);
      if (design) {
        setBackgroundImageUrl(design.backgroundImageUrl || '');
        setImageScale(design.imageScale);
        setImagePositionX(design.imagePositionX);
        setImagePositionY(design.imagePositionY);
        setTicketTypes(design.ticketTypes);
        setShowLoadDialog(false);
        showToast(`Design "${design.name}" loaded from database!`, 'success');
      }
    } catch (error) {
      showToast('Failed to load design', 'error');
    }
  };

  const handleDeleteDesign = async (designId: string, designName: string) => {
    if (confirm(`Are you sure you want to delete "${designName}"?`)) {
      try {
        await deleteDesign(designId);
        showToast(`Design "${designName}" deleted from database!`, 'success');
      } catch (error) {
        showToast('Failed to delete design', 'error');
      }
    }
  };

  const handleDeleteTicket = async (serial: string) => {
    if (confirm(`Are you sure you want to delete ticket ${serial}?`)) {
      try {
        await deleteTicket(serial);
        showToast(`Ticket ${serial} deleted from database!`, 'success');
      } catch (error) {
        showToast('Failed to delete ticket', 'error');
      }
    }
  };

  const totalTickets = ticketTypes.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
  
  const previewTicket: Ticket = {
      serial: 'PREVIEW-TICKET-1234',
      token: 'preview.token.placeholder.not.a.real.token.for.visuals',
      status: TicketStatus.UNSOLD,
      ticketTypeName: ticketTypes[0]?.name || 'Sample Ticket',
      price: ticketTypes[0]?.price || 0,
      printBatchId: 'preview-batch',
  };

  // If viewing all tickets, show the dedicated screen
  if (showAllTickets) {
    return (
      <AllTicketsView
        tickets={allTickets}
        backgroundImageUrl={backgroundImageUrl}
        imageScale={imageScale}
        imagePositionX={imagePositionX}
        imagePositionY={imagePositionY}
        onBack={() => setShowAllTickets(false)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-3xl font-bold text-white">Ticket Batch Generator</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Total tickets in database: <span className="font-semibold text-blue-400">{allTickets.length}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAllTickets(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🎫 View All Tickets ({allTickets.length})
                </button>
                {allTickets.length > 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete ALL ${allTickets.length} tickets? This action cannot be undone!`)) {
                        try {
                          await deleteAllTickets();
                          showToast('All tickets deleted successfully!', 'success');
                        } catch (error) {
                          showToast('Failed to delete tickets', 'error');
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    🗑️ Delete All Tickets
                  </button>
                )}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  💾 Save Design
                </button>
                <button
                  onClick={() => setShowLoadDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  📂 Load Design
                </button>
              </div>
            </div>
            <p className="text-gray-400">Define ticket types and quantities to generate a new print batch. The design is previewed below.</p>
            <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">💾 Database Active:</span> All tickets are automatically saved with unique serial numbers and QR codes. Each QR code is permanently linked to its serial number.
              </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Form */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 h-fit">
              <div className="space-y-4">
                {ticketTypes.map((type, index) => (
                  <div key={type.id} className="space-y-2 p-4 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                          {index === 0 && <label className="text-xs text-gray-400">Type Name</label>}
                          <input
                            type="text"
                            placeholder="e.g., VIP, General Admission"
                            value={type.name}
                            onChange={(e) => handleUpdateType(type.id, 'name', e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                      </div>
                      <div className="md:col-span-2">
                          {index === 0 && <label className="text-xs text-gray-400">Quantity</label>}
                          <input
                            type="number"
                            placeholder="e.g., 2000"
                            value={type.quantity}
                            onChange={(e) => handleUpdateType(type.id, 'quantity', Number(e.target.value))}
                            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                      </div>
                      <div className="md:col-span-2">
                          {index === 0 && <label className="text-xs text-gray-400">Price (GMD)</label>}
                          <input
                            type="number"
                            placeholder="e.g., 75"
                            value={type.price}
                            onChange={(e) => handleUpdateType(type.id, 'price', Number(e.target.value))}
                            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                      </div>
                      <div className="md:col-span-2">
                          {index === 0 && <label className="text-xs text-gray-400">Stub Color</label>}
                          <input
                            type="color"
                            value={type.stubColor || '#F3F1EC'}
                            onChange={(e) => handleUpdateType(type.id, 'stubColor', e.target.value)}
                            className="w-full h-10 rounded cursor-pointer border-2 border-gray-600"
                          />
                      </div>
                      <div className="md:col-span-1 flex items-end h-full">
                        <button onClick={() => handleRemoveType(type.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                          <TrashIcon/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Custom Background Image</label>
                  <label htmlFor="image-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors w-full text-center flex items-center justify-center space-x-2">
                      <ImageIcon className="h-5 w-5" />
                      <span>Change Image</span>
                      <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                
                {backgroundImageUrl && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Image Scale: {imageScale}%</label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={imageScale}
                        onChange={(e) => setImageScale(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Horizontal Position: {imagePositionX}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePositionX}
                        onChange={(e) => setImagePositionX(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Vertical Position: {imagePositionY}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePositionY}
                        onChange={(e) => setImagePositionY(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 border-t border-gray-700 pt-6 flex justify-between items-center">
                <button onClick={handleAddType} className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium">
                  <PlusIcon />
                  <span>Add Type</span>
                </button>
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading || totalTickets === 0}
                    className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center"
                >
                  {isLoading ? (
                      <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                      </>
                  ) : (
                      `Generate ${totalTickets} Tickets`
                  )}
                </button>
              </div>
            </div>
            
            {/* Right Column: Preview */}
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Live Ticket Preview</h3>
                <p className="text-gray-400 mb-4">This is how each generated ticket will look. Details update as you type.</p>
                <div className="sticky top-8">
                     <TicketView 
                       ticket={previewTicket} 
                       backgroundImageUrl={backgroundImageUrl}
                       imageScale={imageScale}
                       imagePositionX={imagePositionX}
                       imagePositionY={imagePositionY}
                       stubColor={ticketTypes[0]?.stubColor || '#F3F1EC'}
                     />
                </div>
            </div>
        </div>

        <TicketPrintLayout 
          tickets={lastGeneratedBatch} 
          backgroundImageUrl={backgroundImageUrl}
          imageScale={imageScale}
          imagePositionX={imagePositionX}
          imagePositionY={imagePositionY}
        />

        {/* Save Design Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Save Design</h3>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Enter design name..."
                className="w-full bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setDesignName('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDesign}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Design Dialog */}
        {showLoadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Load Design</h3>
              {designs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No saved designs yet. Save your first design to see it here!</p>
              ) : (
                <div className="space-y-3">
                  {designs.map((design) => (
                    <div key={design.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600 flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-semibold">{design.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {design.ticketTypes.length} ticket type(s) • Created {new Date(design.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadDesign(design.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteDesign(design.id, design.name)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage('')}
          />
        )}
      </div>
    </div>
  );
};

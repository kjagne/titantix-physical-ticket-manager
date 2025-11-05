
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TicketGenerator } from './components/TicketGenerator';
import { BoxOffice } from './components/BoxOffice';
import { GateScanner } from './components/GateScanner';
import { Login } from './components/Login';
import { useTicketManager } from './hooks/useTicketManager';

type View = 'generate' | 'sell' | 'scan';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('generate');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const ticketManager = useTicketManager();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (token: string, userData: any) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'generate':
        return <TicketGenerator 
          generateTickets={ticketManager.generateTickets} 
          lastGeneratedBatch={ticketManager.lastGeneratedBatch} 
          ticketCount={ticketManager.ticketCount}
          deleteTicket={ticketManager.deleteTicket}
          deleteAllTickets={ticketManager.deleteAllTickets}
          refreshTicketCount={ticketManager.refreshTicketCount}
        />;
      case 'sell':
        return <BoxOffice sellTicket={ticketManager.sellTicket} />;
      case 'scan':
        return <GateScanner scanTicket={ticketManager.scanTicket} />;
      default:
        return <TicketGenerator 
          generateTickets={ticketManager.generateTickets} 
          lastGeneratedBatch={ticketManager.lastGeneratedBatch} 
          ticketCount={ticketManager.ticketCount}
          deleteTicket={ticketManager.deleteTicket}
          deleteAllTickets={ticketManager.deleteAllTickets}
          refreshTicketCount={ticketManager.refreshTicketCount}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default App;

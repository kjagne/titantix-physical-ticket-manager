
import React from 'react';
import { TicketIcon } from './icons/TicketIcon';
import { GenerateIcon } from './icons/GenerateIcon';
import { SellIcon } from './icons/SellIcon';
import { ScanIcon } from './icons/ScanIcon';

type View = 'generate' | 'sell' | 'scan' | 'database';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  user?: any;
  onLogout?: () => void;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, user, onLogout }) => {
  return (
    <header className="bg-gray-800 text-white shadow-md print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <TicketIcon className="h-8 w-8 text-blue-400" />
            <h1 className="ml-3 text-xl font-bold tracking-tight">TitanTix Manager</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-2 p-1 bg-gray-900 rounded-lg">
              <NavButton
                label="Generate"
                icon={<GenerateIcon className="h-5 w-5" />}
                isActive={currentView === 'generate'}
                onClick={() => onViewChange('generate')}
              />
              <NavButton
                label="Box Office"
                icon={<SellIcon className="h-5 w-5" />}
                isActive={currentView === 'sell'}
                onClick={() => onViewChange('sell')}
              />
              <NavButton
                label="Gate Scan"
                icon={<ScanIcon className="h-5 w-5" />}
                isActive={currentView === 'scan'}
                onClick={() => onViewChange('scan')}
              />
              <NavButton
                label="Database"
                icon={<span className="text-lg">💾</span>}
                isActive={currentView === 'database'}
                onClick={() => onViewChange('database')}
              />
            </nav>

            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                  <p className="text-xs text-gray-400">{user.role}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

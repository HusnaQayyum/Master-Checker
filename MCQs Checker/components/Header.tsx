
import React from 'react';
import { AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">QuizMaster <span className="text-indigo-600">Pro</span></span>
          </div>

          <nav className="hidden md:flex space-x-1">
            <TabButton 
              active={activeTab === AppTab.DASHBOARD} 
              onClick={() => setActiveTab(AppTab.DASHBOARD)}
              label="Overview"
              icon={<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            />
            <TabButton 
              active={activeTab === AppTab.MASTER_KEY} 
              onClick={() => setActiveTab(AppTab.MASTER_KEY)}
              label="Master Answer Key"
              icon={<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
            />
            <TabButton 
              active={activeTab === AppTab.CHECK_SHEETS} 
              onClick={() => setActiveTab(AppTab.CHECK_SHEETS)}
              label="Check Sheets"
              icon={<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
          </nav>

          <div className="md:hidden flex items-center">
            <select 
              value={activeTab} 
              onChange={(e) => setActiveTab(e.target.value as AppTab)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
            >
              <option value={AppTab.DASHBOARD}>Overview</option>
              <option value={AppTab.MASTER_KEY}>Master Key</option>
              <option value={AppTab.CHECK_SHEETS}>Check Sheets</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active 
        ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600 rounded-none' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Header;

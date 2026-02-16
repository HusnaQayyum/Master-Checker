
import React, { useState, useEffect } from 'react';
import { AppTab, AnswerKey, StudentResult, Grade } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MasterKeySetup from './components/MasterKeySetup';
import StudentCheck from './components/StudentCheck';

export const calculateGrade = (percentage: number): Grade => {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 65) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [masterKey, setMasterKey] = useState<AnswerKey | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('quizmaster_key');
    const savedResults = localStorage.getItem('quizmaster_results');
    if (savedKey) setMasterKey(JSON.parse(savedKey));
    if (savedResults) setStudentResults(JSON.parse(savedResults));
  }, []);

  useEffect(() => {
    if (masterKey) localStorage.setItem('quizmaster_key', JSON.stringify(masterKey));
  }, [masterKey]);

  useEffect(() => {
    localStorage.setItem('quizmaster_results', JSON.stringify(studentResults));
  }, [studentResults]);

  const handleUpdateMasterKey = (newKey: AnswerKey) => {
    setMasterKey(newKey);
  };

  const handleAddResults = (newResults: StudentResult[]) => {
    setStudentResults(prev => [...prev, ...newResults]);
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setMasterKey(null);
      setStudentResults([]);
      localStorage.removeItem('quizmaster_key');
      localStorage.removeItem('quizmaster_results');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === AppTab.DASHBOARD && (
          <Dashboard 
            masterKey={masterKey} 
            results={studentResults} 
            onClearData={clearAllData}
            onNavigate={setActiveTab}
          />
        )}
        
        {activeTab === AppTab.MASTER_KEY && (
          <MasterKeySetup 
            masterKey={masterKey} 
            onSave={handleUpdateMasterKey} 
          />
        )}
        
        {activeTab === AppTab.CHECK_SHEETS && (
          <StudentCheck 
            masterKey={masterKey} 
            onAddResults={handleAddResults}
            results={studentResults}
          />
        )}
      </main>

      <footer className="bg-white border-t py-6 text-center">
        <p className="text-sm text-gray-500 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} QUIZMASTER CHECKER PRO • POWERED BY GEMINI AI 3.0
        </p>
      </footer>
    </div>
  );
};

export default App;

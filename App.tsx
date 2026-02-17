
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import ReportBuilder from './components/ReportBuilder';
import History from './components/History';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const handleEditReport = (reportId: string) => {
    setEditingReportId(reportId);
    setCurrentTab('report-builder');
  };

  const handleTabChange = (tab: string) => {
    if (tab !== 'report-builder') {
      setEditingReportId(null);
    }
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'patients': return <PatientManagement />;
      case 'report-builder': 
        return (
          <ReportBuilder 
            reportId={editingReportId} 
            onClose={() => {
              setEditingReportId(null);
              setCurrentTab('history');
            }} 
          />
        );
      case 'history': 
        return <History onEditReport={handleEditReport} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Navigation 
        currentTab={currentTab} 
        onTabChange={handleTabChange} 
        onLogout={() => setIsAuthenticated(false)}
      />
      <main className="flex-1 ml-64 p-10 max-w-[1400px] mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

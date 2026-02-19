
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientManagement from './components/PatientManagement';
import ReportBuilder from './components/ReportBuilder';
import History from './components/History';
import AppointmentManagement from './components/AppointmentManagement';

export type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('vet_dental_theme') as Theme) || 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('vet_dental_theme', theme);

    const applyTheme = (t: Theme) => {
      if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

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
      case 'dashboard': return <Dashboard currentTheme={theme} onThemeChange={setTheme} />;
      case 'appointments': return <AppointmentManagement />;
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
      default: return <Dashboard currentTheme={theme} onThemeChange={setTheme} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
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


import React from 'react';
import { LayoutDashboard, Users, FilePlus2, History, LogOut, Dog, CalendarDays } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Usuario y Mascota', icon: Users },
    { id: 'appointments', label: 'Agenda de Citas', icon: CalendarDays },
    { id: 'report-builder', label: 'Generar Reporte', icon: FilePlus2 },
    { id: 'history', label: 'Historial', icon: History },
  ];

  return (
    <nav className="w-64 bg-white dark:bg-slate-800 h-screen border-r border-slate-200 dark:border-slate-700 flex flex-col fixed left-0 top-0 transition-colors duration-300 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
          <Dog className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">VetDental</h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default Navigation;

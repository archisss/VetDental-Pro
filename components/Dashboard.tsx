
import React from 'react';
import { DB } from '../services/db';
import { Users, FileText, ClipboardList, Activity, Sun, Moon, Monitor, Clock } from 'lucide-react';
import { Theme } from '../App';

interface DashboardProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentTheme, onThemeChange }) => {
  const petsCount = DB.getPets().length;
  const reportsCount = DB.getReports().length;
  const appointments = DB.getAppointments()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); // Just show the first 5 upcoming

  const stats = [
    { label: 'Pacientes Totales', value: petsCount, icon: Users, color: 'bg-blue-500' },
    { label: 'Reportes Generados', value: reportsCount, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Citas Agendadas', value: DB.getAppointments().length, icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Tasa de Éxito', value: '98%', icon: Activity, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Bienvenida de nuevo</h2>
          <p className="text-slate-500 dark:text-slate-400">Aquí tienes un resumen de la actividad clínica de hoy.</p>
        </div>

        {/* Theme Selector */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex shadow-sm transition-all">
          <button
            onClick={() => onThemeChange('light')}
            className={`p-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
              currentTheme === 'light' 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Sun className="w-4 h-4" />
            Claro
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={`p-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
              currentTheme === 'dark' 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Moon className="w-4 h-4" />
            Oscuro
          </button>
          <button
            onClick={() => onThemeChange('system')}
            className={`p-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all ${
              currentTheme === 'system' 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Sistema
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:scale-[1.02]">
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-indigo-100 dark:shadow-none`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-all">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Próximas Citas Dentales</h3>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {app.petName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{app.petName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{app.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {app.time}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{new Date(app.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 italic text-sm">
                No hay citas programadas para hoy.
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden flex flex-col justify-between">
           <div className="relative z-10 space-y-2">
             <h3 className="text-2xl font-bold">Consejo Dental del Día</h3>
             <p className="text-indigo-100 leading-relaxed">
               "La gingivitis en felinos puede ser el primer signo de problemas sistémicos. 
               Siempre tome fotos comparativas para el reporte del dueño."
             </p>
           </div>
           <button className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold mt-6 w-fit shadow-md hover:bg-slate-50 transition-colors">
             Ver Guías de Cuidado
           </button>
           {/* Decorative shape */}
           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

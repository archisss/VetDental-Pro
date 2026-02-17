
import React from 'react';
import { DB } from '../services/db';
import { Users, FileText, ClipboardList, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const petsCount = DB.getPets().length;
  const reportsCount = DB.getReports().length;

  const stats = [
    { label: 'Pacientes Totales', value: petsCount, icon: Users, color: 'bg-blue-500' },
    { label: 'Reportes Generados', value: reportsCount, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Consultas este mes', value: Math.floor(reportsCount * 0.7), icon: ClipboardList, color: 'bg-emerald-500' },
    { label: 'Tasa de Éxito', value: '98%', icon: Activity, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-slate-900">Bienvenida de nuevo, Dra. Dental</h2>
        <p className="text-slate-500">Aquí tienes un resumen de la actividad clínica de hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-indigo-100`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Próximas Citas Dentales</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">P</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Paciente Ejemplo #{i}</p>
                    <p className="text-xs text-slate-500">Profilaxis Dental</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 text-sm">10:30 AM</p>
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Confirmado</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-between">
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

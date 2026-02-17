
import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Pet, DentalReport, ReportItem } from '../types';
import { Calendar, Eye, FileText, ChevronRight, Edit2 } from 'lucide-react';

interface HistoryProps {
  onEditReport: (reportId: string) => void;
}

const History: React.FC<HistoryProps> = ({ onEditReport }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [reports, setReports] = useState<DentalReport[]>([]);
  const [viewingReport, setViewingReport] = useState<DentalReport | null>(null);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);

  useEffect(() => {
    setPets(DB.getPets());
  }, []);

  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
    setReports(DB.getReportsByPet(pet.id));
    setViewingReport(null);
    setReportItems([]);
  };

  const handleViewReport = (report: DentalReport) => {
    setViewingReport(report);
    setReportItems(DB.getReportItems(report.id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Historial de Reportes Dentales</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pets List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 uppercase text-xs tracking-wider">Pacientes</div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => handleSelectPet(pet)}
                className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  selectedPet?.id === pet.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                }`}
              >
                <div className="text-left">
                  <p className="font-bold text-slate-800">{pet.name}</p>
                  <p className="text-xs text-slate-500">{pet.ownerName} - {pet.type}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Reports for selected pet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 uppercase text-xs tracking-wider">
            {selectedPet ? `Reportes de ${selectedPet.name}` : 'Seleccione un paciente'}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {reports.map(report => (
              <div
                key={report.id}
                className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group ${
                  viewingReport?.id === report.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                }`}
                onClick={() => handleViewReport(report)}
              >
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-800">{new Date(report.date).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">ID: {report.id.substring(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditReport(report.id);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm"
                    title="Editar Reporte"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <Eye className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 self-center" />
                </div>
              </div>
            ))}
            {selectedPet && reports.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic">No hay reportes previos</div>
            )}
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex items-center justify-between uppercase text-xs tracking-wider">
            <span>Vista Previa</span>
            {viewingReport && (
              <span className="text-[10px] font-normal text-slate-400">{new Date(viewingReport.date).toLocaleString()}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {viewingReport ? (
              reportItems.map((item, idx) => (
                <div key={item.id} className="space-y-3">
                  <div className="bg-slate-900 rounded-xl aspect-video overflow-hidden border border-slate-800">
                    <img
                      src={item.imageData}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${item.rotation}deg) scaleX(${item.isMirrored ? -1 : 1})`
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">Hallazgo #{idx + 1}</span>
                    <p className="text-slate-700 text-sm mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="border-b border-slate-100 pt-4"></div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <FileText className="w-16 h-16 opacity-10" />
                <p className="text-sm font-medium">Seleccione un reporte para visualizarlo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;

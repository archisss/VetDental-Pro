
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

  useEffect(() => {
    const loadPets = async () => {
      const petsData = await DB.getPets();
      setPets(petsData);
    };
    loadPets();
  }, []);

  const handleSelectPet = async (pet: Pet) => {
    setSelectedPet(pet);
    const petReports = await DB.getReportsByPet(pet.id);
    setReports(petReports);
  };

  const handleViewReportPDF = async (report: DentalReport) => {
    if (!selectedPet) return;
    const reportItems = await DB.getReportItems(report.id);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte Odontológico - ${selectedPet.name}</title>
        <style>
          @page { margin: 10mm; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 0; color: #1e293b; line-height: 1.4; font-size: 11pt; }
          .container { max-width: 900px; margin: 0 auto; padding: 10px; }
          
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; }
          .header-meta { text-align: right; color: #64748b; font-size: 8.5pt; }
          
          .pet-info { margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 8px; display: grid; grid-template-columns: 1fr; gap: 12px; border: 1px solid #e2e8f0; }
          .pet-info div { display: flex; flex-direction: column; }
          
          .section-title { font-size: 9.5pt; font-weight: bold; color: #4f46e5; margin: 10px 0 4px 0; border-left: 3px solid #4f46e5; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .text-block { background: #fff; padding: 6px; border-radius: 6px; border: 1px solid #f1f5f9; margin-bottom: 6px; white-space: pre-wrap; font-size: 9.5pt; color: #334155; }
          
          .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 5px; }
          .gallery-item { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
          .gallery-item:last-child:nth-child(odd) { grid-column: 1 / span 2; justify-self: center; width: 49%; }
          
          .img-container { background: #fff; height: 180px; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; image-rendering: -webkit-optimize-contrast; }
          .description { padding: 8px; font-size: 8.5pt; color: #475569; flex-grow: 1; border-top: 1px solid #f1f5f9; }
          
          .label { font-weight: bold; font-size: 7pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 1px; }
          .value { font-weight: 600; font-size: 9.5pt; color: #1e293b; }

          .signature-footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; page-break-inside: avoid; }
          .signature-details { font-size: 8.5pt; color: #1e293b; margin-bottom: 10px; }
          .signature-details p { margin: 1px 0; line-height: 1.25; }
          
          .signature-credits { 
            font-size: 8pt; 
            color: #64748b; 
            border-top: 1px solid #f1f5f9; 
            padding-top: 8px; 
            text-align: left; 
          }
          .signature-credits strong { color: #4f46e5; }

          @media print {
            body { padding: 0; }
            .container { max-width: 100%; }
            .section-title { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1>VetDental Pro</h1>
              <p style="margin: 0; font-weight: 600; color: #64748b; font-size: 8.5pt;">Reporte Odontológico Completo</p>
            </div>
            <div class="header-meta">
              <p>${new Date(report.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div class="pet-info">
            <div>
              <span class="label">Paciente</span>
              <span class="value">${selectedPet.name}</span>
              <span style="font-size: 8.5pt; color: #64748b;">${selectedPet.type} | ${selectedPet.breed} | Cráneo: ${selectedPet.skullType} | Edad: ${selectedPet.age} años</span>
            </div>
          </div>

          ${report.clinicalHistory ? `
            <div class="section-title">Historia Clínica</div>
            <div class="text-block">${report.clinicalHistory}</div>
          ` : ''}

          <div class="section-title">Imágenes y Hallazgos Visuales</div>
          <div class="gallery">
            ${reportItems.map((item, i) => `
              <div class="gallery-item">
                <div class="img-container">
                  <img src="${item.imageData}" style="transform: rotate(${item.rotation}deg) scaleX(${item.isMirrored ? -1 : 1})">
                </div>
                <div class="description">
                  ${item.description || 'Sin descripción técnica.'}
                </div>
              </div>
            `).join('')}
          </div>

          ${report.recommendedTreatment ? `
            <div class="section-title">Tratamiento Recomendado</div>
            <div class="text-block">${report.recommendedTreatment}</div>
          ` : ''}

          ${report.otherComments ? `
            <div class="section-title">Observaciones Adicionales</div>
            <div class="text-block">${report.otherComments}</div>
          ` : ''}

          <div class="signature-footer">
            <div class="signature-details">
              <p>MVZ. Especializada en odontología veterinaria por ANCLIVEPA, Sao Paulo, Brasil.</p>
              <p style="font-size: 10pt; margin-top: 4px;"><strong>Thalia J. Chávez R.</strong></p>
              <p>Cédula Profesional: 8061296</p>
              <p>Thaliachavez@gmail.com</p>
            </div>
            
            <div class="signature-credits">
              <p>Este documento fue creado a travez de <strong>VetDental Pro</strong>, Todos los Derechos reservador</p>
              <p>Creado por <strong>Incéntrica</strong> © 2026</p>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Historial de Reportes Dentales</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pets List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[700px] transition-all">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Pacientes</div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => handleSelectPet(pet)}
                className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  selectedPet?.id === pet.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-4 border-indigo-500' : ''
                }`}
              >
                <div className="text-left">
                  <p className={`font-bold transition-colors ${selectedPet?.id === pet.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{pet.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pet.clinicName} - {pet.type}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${selectedPet?.id === pet.id ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} />
              </button>
            ))}
            {pets.length === 0 && (
               <div className="p-8 text-center text-slate-400 dark:text-slate-500 italic">Aún no hay pacientes registrados</div>
            )}
          </div>
        </div>

        {/* Reports for selected pet */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[700px] transition-all">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">
            {selectedPet ? `Reportes de ${selectedPet.name}` : 'Seleccione un paciente'}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {reports.map(report => (
              <div
                key={report.id}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(report.date).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ID: {report.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewReportPDF(report)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                    title="Ver PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditReport(report.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                    title="Editar Reporte"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {selectedPet && reports.length === 0 && (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 italic">No hay reportes previos</div>
            )}
            {!selectedPet && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 space-y-4">
                <FileText className="w-16 h-16 opacity-10" />
                <p className="text-sm font-medium">Seleccione un paciente para ver su historial</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;

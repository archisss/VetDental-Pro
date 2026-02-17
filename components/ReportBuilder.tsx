
import React, { useState, useEffect, useRef } from 'react';
import { DB } from '../services/db';
import { Pet, DentalReport, ReportItem } from '../types';
import { ImagePlus, RotateCcw, FlipHorizontal, Save, FileText, CheckCircle2, ArrowLeft, Eye, Check, ClipboardList, Stethoscope, MessageSquare } from 'lucide-react';

interface ReportBuilderProps {
  reportId?: string | null;
  onClose?: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ reportId, onClose }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [currentReport, setCurrentReport] = useState<DentalReport | null>(null);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Report-level fields
  const [clinicalHistory, setClinicalHistory] = useState('');
  const [recommendedTreatment, setRecommendedTreatment] = useState('');
  const [otherComments, setOtherComments] = useState('');

  // Current Item Form
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isMirrored, setIsMirrored] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPets(DB.getPets());
    if (reportId) {
      const existing = DB.getReportById(reportId);
      if (existing) {
        setCurrentReport(existing);
        setSelectedPetId(existing.petId);
        setClinicalHistory(existing.clinicalHistory || '');
        setRecommendedTreatment(existing.recommendedTreatment || '');
        setOtherComments(existing.otherComments || '');
        setReportItems(DB.getReportItems(reportId));
      }
    }
  }, [reportId]);

  const handleStartReport = () => {
    if (!selectedPetId) return;
    const report = DB.createReport(selectedPetId);
    setCurrentReport(report);
    setReportItems([]);
    setClinicalHistory('');
    setRecommendedTreatment('');
    setOtherComments('');
    setHasUnsavedChanges(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        setRotation(0);
        setIsMirrored(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = () => {
    if (!currentReport || !currentImage) return;

    const reportToSave = {
      ...currentReport,
      clinicalHistory,
      recommendedTreatment,
      otherComments
    };
    DB.saveReport(reportToSave);
    setCurrentReport(reportToSave);

    const newItem = DB.saveReportItem({
      reportId: currentReport.id,
      imageData: currentImage,
      description: currentDescription,
      rotation,
      isMirrored
    });

    setReportItems([...reportItems, newItem]);
    setHasUnsavedChanges(true);
    
    setCurrentImage(null);
    setCurrentDescription('');
    setRotation(0);
    setIsMirrored(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExplicitSave = () => {
    if (!currentReport) return;
    const reportToSave = {
      ...currentReport,
      clinicalHistory,
      recommendedTreatment,
      otherComments
    };
    DB.saveReport(reportToSave);
    setCurrentReport(reportToSave);
    setHasUnsavedChanges(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handlePreviewReport = () => {
    if (!currentReport) return;

    const pet = pets.find(p => p.id === selectedPetId);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte Dental - ${pet?.name}</title>
        <style>
          @page { margin: 10mm; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 0; color: #1e293b; line-height: 1.4; font-size: 11pt; }
          .container { max-width: 900px; margin: 0 auto; padding: 10px; }
          
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 18pt; font-weight: 800; letter-spacing: -0.5px; }
          .header-meta { text-align: right; color: #64748b; font-size: 8.5pt; }
          
          .pet-info { margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border: 1px solid #e2e8f0; }
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
              <p style="margin: 0; font-weight: 600; color: #64748b; font-size: 8.5pt;">Reporte Clínico Odontológico Especializado</p>
            </div>
            <div class="header-meta">
              <p>${new Date(currentReport.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div class="pet-info">
            <div>
              <span class="label">Paciente</span>
              <span class="value">${pet?.name}</span>
              <span style="font-size: 8.5pt; color: #64748b;">${pet?.type} | ${pet?.breed}</span>
            </div>
            <div>
              <span class="label">Propietario</span>
              <span class="value">${pet?.ownerName}</span>
              <span class="label" style="margin-top: 3px">Edad</span>
              <span class="value">${pet?.age} años</span>
            </div>
          </div>

          ${clinicalHistory ? `
            <div class="section-title">Historia Clínica</div>
            <div class="text-block">${clinicalHistory}</div>
          ` : ''}

          <div class="section-title">Evidencia y Hallazgos Visuales</div>
          <div class="gallery">
            ${reportItems.map((item, i) => `
              <div class="gallery-item">
                <div class="img-container">
                  <img src="${item.imageData}" style="transform: rotate(${item.rotation}deg) scaleX(${item.isMirrored ? -1 : 1})">
                </div>
                <div class="description">
                  <div class="label" style="margin-bottom: 2px; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px;">Evidencia #${i + 1}</div>
                  ${item.description || 'Sin descripción técnica.'}
                </div>
              </div>
            `).join('')}
          </div>

          ${recommendedTreatment ? `
            <div class="section-title">Tratamiento Recomendado</div>
            <div class="text-block">${recommendedTreatment}</div>
          ` : ''}

          ${otherComments ? `
            <div class="section-title">Observaciones Adicionales</div>
            <div class="text-block">${otherComments}</div>
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

  if (!currentReport) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Iniciar Reporte Médico</h2>
          <p className="text-slate-500">Seleccione un paciente para comenzar la evaluación dental</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Seleccionar Animal / Paciente</label>
            <select
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg text-slate-900"
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value)}
            >
              <option value="" className="text-slate-500">-- Elige un paciente --</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id} className="text-slate-900">
                  {pet.name} ({pet.ownerName}) - {pet.type}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartReport}
            disabled={!selectedPetId}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-3"
          >
            <FileText className="w-6 h-6" />
            Iniciar Nuevo Reporte
          </button>
        </div>
      </div>
    );
  }

  const selectedPet = pets.find(p => p.id === selectedPetId);

  return (
    <div className="space-y-8 pb-20 relative">
      {showSavedToast && (
        <div className="fixed top-10 right-10 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce z-50">
          <Check className="w-5 h-5" />
          Cambios guardados correctamente
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reporte Dental: {selectedPet?.name}</h2>
            <p className="text-slate-500">Dueño: {selectedPet?.ownerName} | {new Date(currentReport.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExplicitSave}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 border shadow-sm ${
              hasUnsavedChanges 
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100' 
              : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            Guardar Reporte
          </button>
          <button
            onClick={handlePreviewReport}
            disabled={reportItems.length === 0}
            className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Vista Previa (Imprimir)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Historia Clínica Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-xs tracking-wider">
              <ClipboardList className="w-4 h-4" />
              Historia Clínica
            </div>
            <textarea
              placeholder="Describa la historia clínica relevante para este procedimiento..."
              className="w-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 placeholder:text-slate-400"
              value={clinicalHistory}
              onChange={e => { setClinicalHistory(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-indigo-500" />
              Agregar Nueva Evidencia
            </h3>
            
            <div 
              className={`relative border-2 border-dashed rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                currentImage ? 'border-indigo-400 bg-slate-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Previsualización"
                  className="w-full h-full object-contain transition-transform duration-300"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${isMirrored ? -1 : 1})`
                  }}
                />
              ) : (
                <>
                  <ImagePlus className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-400 font-medium">Haga clic para subir una foto</p>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            {currentImage && (
              <div className="flex gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMirrored(!isMirrored); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  Efecto Espejo
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Girar 90°
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Descripción Médica del Hallazgo</label>
              <textarea
                placeholder="Describa el hallazgo dental para el dueño de la mascota..."
                className="w-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 placeholder:text-slate-400"
                value={currentDescription}
                onChange={e => setCurrentDescription(e.target.value)}
              />
            </div>

            <button
              onClick={handleSaveItem}
              disabled={!currentImage}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              Añadir Hallazgo al Reporte
            </button>
          </div>

          {/* Tratamiento Recomendado Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-xs tracking-wider">
              <Stethoscope className="w-4 h-4" />
              Tratamiento Recomendado
            </div>
            <textarea
              placeholder="Indique los pasos a seguir y recomendaciones terapéuticas..."
              className="w-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 placeholder:text-slate-400"
              value={recommendedTreatment}
              onChange={e => { setRecommendedTreatment(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          {/* Otros Comentarios Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase text-xs tracking-wider">
              <MessageSquare className="w-4 h-4" />
              Otros Comentarios
            </div>
            <textarea
              placeholder="Notas adicionales, advertencias o recordatorios..."
              className="w-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 placeholder:text-slate-400"
              value={otherComments}
              onChange={e => { setOtherComments(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-wider">
            Evidencias Acumuladas
            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">{reportItems.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[1200px] pr-2">
            {reportItems.map((item, index) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-28 h-28 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                  <img
                    src={item.imageData}
                    className="w-full h-full object-contain"
                    style={{
                      transform: `rotate(${item.rotation}deg) scaleX(${item.isMirrored ? -1 : 1})`
                    }}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">ITEM #{index + 1}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3 italic leading-relaxed">"{item.description || 'Sin descripción'}"</p>
                </div>
              </div>
            ))}
            {reportItems.length === 0 && (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-2 opacity-10" />
                <p className="text-sm">Aún no hay evidencias guardadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;

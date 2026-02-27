
import React, { useState, useEffect, useRef } from 'react';
import { DB } from '../services/db';
import { Pet, DentalReport, ReportItem } from '../types';
import { ImagePlus, RotateCcw, FlipHorizontal, Save, FileText, CheckCircle2, ArrowLeft, Eye, Check, ClipboardList, Stethoscope, MessageSquare, Edit, Trash2, X, Pencil, Eraser, Search } from 'lucide-react';

interface ReportBuilderProps {
  reportId?: string | null;
  onClose?: () => void;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ reportId, onClose }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Drawing states
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const petsData = await DB.getPets();
      setPets(petsData);
      if (reportId) {
        const existing = await DB.getReportById(reportId);
        if (existing) {
          setCurrentReport(existing);
          setSelectedPetId(existing.petId);
          setClinicalHistory(existing.clinicalHistory || '');
          setRecommendedTreatment(existing.recommendedTreatment || '');
          setOtherComments(existing.otherComments || '');
          const items = await DB.getReportItems(reportId);
          setReportItems(items);
        }
      }
    };
    loadData();
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
        const result = reader.result as string;
        setCurrentImage(result);
        setRotation(0);
        setIsMirrored(false);
        
        // Calculate aspect ratio
        const img = new Image();
        img.onload = () => {
          setImageAspectRatio(img.width / img.height);
        };
        img.src = result;

        // Clear canvas when new image is loaded
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedColor) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !selectedColor || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    // Scale coordinates to canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = selectedColor;

    ctx.lineTo(x * scaleX, y * scaleY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x * scaleX, y * scaleY);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveItem = async () => {
    if (!currentReport || !currentImage) return;

    try {
      // Combine image and drawings if there are any
      let finalImageData = currentImage;
      const canvas = canvasRef.current;
      
      if (canvas) {
        // Create a temporary canvas to merge image and drawings
        const tempCanvas = document.createElement('canvas');
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = currentImage;
        });

        const isVertical = rotation === 90 || rotation === 270;
        tempCanvas.width = isVertical ? img.height : img.width;
        tempCanvas.height = isVertical ? img.width : img.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // 1. Draw the original image with transformations
          tempCtx.save();
          tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
          tempCtx.rotate((rotation * Math.PI) / 180);
          tempCtx.scale(isMirrored ? -1 : 1, 1);
          tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
          tempCtx.restore();

          // 2. Draw the annotations on top
          // We need to scale the annotations from the UI canvas to the original image size
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          
          finalImageData = tempCanvas.toDataURL('image/jpeg', 0.8);
        }
      }

      const reportToSave = {
        ...currentReport,
        clinicalHistory,
        recommendedTreatment,
        otherComments
      };
      await DB.saveReport(reportToSave);
      setCurrentReport(reportToSave);

      const itemData = {
        reportId: currentReport.id,
        imageData: finalImageData,
        description: currentDescription,
        rotation: 0, // Reset rotation/mirror as they are now baked into the image
        isMirrored: false
      };

      if (editingItemId) {
        const updatedItem = await DB.saveReportItem({ ...itemData, id: editingItemId } as ReportItem);
        setReportItems(reportItems.map(item => item.id === editingItemId ? updatedItem : item));
        setEditingItemId(null);
      } else {
        const newItem = await DB.saveReportItem(itemData);
        setReportItems([...reportItems, newItem]);
      }

      setHasUnsavedChanges(true);
      
      setCurrentImage(null);
      setCurrentDescription('');
      setRotation(0);
      setIsMirrored(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error al guardar el hallazgo. Por favor, intente de nuevo.');
    }
  };

  const handleEditItem = (item: ReportItem) => {
    setEditingItemId(item.id);
    setCurrentImage(item.imageData);
    setCurrentDescription(item.description);
    setRotation(item.rotation);
    setIsMirrored(item.isMirrored);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta evidencia?')) {
      await DB.deleteReportItem(id);
      setReportItems(reportItems.filter(item => item.id !== id));
      if (editingItemId === id) {
        setEditingItemId(null);
        setCurrentImage(null);
        setCurrentDescription('');
        setRotation(0);
        setIsMirrored(false);
      }
      setHasUnsavedChanges(true);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setCurrentImage(null);
    setCurrentDescription('');
    setRotation(0);
    setIsMirrored(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExplicitSave = async () => {
    if (!currentReport) return;
    const reportToSave = {
      ...currentReport,
      clinicalHistory,
      recommendedTreatment,
      otherComments
    };
    await DB.saveReport(reportToSave);
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
        <title>Reporte Odontológico - ${pet?.name}</title>
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
              <p>${new Date(currentReport.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div class="pet-info">
            <div>
              <span class="label">Paciente</span>
              <span class="value">${pet?.name}</span>
              <span style="font-size: 8.5pt; color: #64748b;">${pet?.type} | ${pet?.breed} | Cráneo: ${pet?.skullType} | Edad: ${pet?.age} años</span>
            </div>
          </div>

          ${clinicalHistory ? `
            <div class="section-title">Historia Clínica</div>
            <div class="text-block">${clinicalHistory}</div>
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
            // Auto-print disabled as per request
            // setTimeout(() => {
            //   window.print();
            // }, 500);
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
      <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Iniciar Reporte Médico</h2>
          <p className="text-slate-500 dark:text-slate-400">Seleccione un paciente para comenzar la evaluación dental</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-6 transition-all">
          <div className="space-y-2 relative">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Buscar Paciente</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Escribe el nombre del paciente o clínica..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg text-slate-900 dark:text-white transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>
            
            {isSearchOpen && searchTerm && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
                {pets
                  .filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    p.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPetId(pet.id);
                        setSearchTerm(`${pet.name} (${pet.clinicName})`);
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">{pet.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{pet.clinicName} - {pet.type}</p>
                    </button>
                  ))}
                {pets.filter(p => 
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  p.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="px-6 py-4 text-slate-500 text-center italic">No se encontraron pacientes</div>
                )}
              </div>
            )}
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
    <div className="space-y-8 pb-20 relative animate-in fade-in duration-500">
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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reporte Odontológico: {selectedPet?.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">Clínica: {selectedPet?.clinicName} | {new Date(currentReport.date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExplicitSave}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 border shadow-sm ${
              hasUnsavedChanges 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800/50' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Save className="w-4 h-4" />
            Guardar Reporte
          </button>
          <button
            onClick={handlePreviewReport}
            disabled={reportItems.length === 0}
            className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Vista Previa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Historia Clínica Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <ClipboardList className="w-4 h-4" />
              Historia Clínica
            </div>
            <textarea
              placeholder="Describa la historia clínica relevante para este procedimiento..."
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={clinicalHistory}
              onChange={e => { setClinicalHistory(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-indigo-500" />
                {editingItemId ? 'Editar Imagen' : 'Agregar Nueva Imagen'}
              </h3>
              {editingItemId && (
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancelar Edición
                </button>
              )}
            </div>
            
            <div 
              ref={containerRef}
              className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                currentImage ? 'border-indigo-400 dark:border-indigo-500 bg-slate-900' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/80 aspect-video'
              }`}
              style={currentImage && imageAspectRatio ? { aspectRatio: `${imageAspectRatio}` } : {}}
              onClick={() => !currentImage && fileInputRef.current?.click()}
            >
              {currentImage ? (
                <>
                  <img
                    src={currentImage}
                    alt="Previsualización"
                    className="w-full h-full object-contain transition-transform duration-300"
                    style={{
                      transform: `rotate(${rotation}deg) scaleX(${isMirrored ? -1 : 1})`
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full ${selectedColor ? 'cursor-crosshair' : 'pointer-events-none'}`}
                    width={2000} // High resolution
                    height={2000 / (imageAspectRatio || 1)}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </>
              ) : (
                <>
                  <ImagePlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-slate-400 dark:text-slate-600 font-medium">Haga clic para subir una foto</p>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {[
                      { color: '#ef4444', label: 'Rojo' },
                      { color: '#f97316', label: 'Naranja' },
                      { color: '#eab308', label: 'Amarillo' },
                      { color: '#22c55e', label: 'Verde' }
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setSelectedColor(selectedColor === c.color ? null : c.color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          selectedColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={`Dibujar en ${c.label}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearCanvas}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      title="Limpiar dibujos"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsMirrored(!isMirrored); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    Efecto Espejo
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Girar 90°
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Descripción Médica del Hallazgo</label>
              <textarea
                placeholder="Describa el hallazgo dental para el dueño de la mascota..."
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
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
              {editingItemId ? 'Guardar Cambios' : 'Añadir Imagen al Reporte'}
            </button>
          </div>

          {/* Tratamiento Recomendado Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <Stethoscope className="w-4 h-4" />
              Tratamiento Recomendado
            </div>
            <textarea
              placeholder="Indique los pasos a seguir y recomendaciones terapéuticas..."
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={recommendedTreatment}
              onChange={e => { setRecommendedTreatment(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          {/* Otros Comentarios Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <MessageSquare className="w-4 h-4" />
              Otros Comentarios
            </div>
            <textarea
              placeholder="Notas adicionales, advertencias o recordatorios..."
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={otherComments}
              onChange={e => { setOtherComments(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase text-xs tracking-wider">
            Imágenes Acumuladas
            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs font-bold">{reportItems.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[1200px] pr-2">
            {reportItems.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-4 shadow-sm hover:shadow-md transition-all group">
                <div className="w-28 h-28 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-800 dark:border-slate-700">
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
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">IMAGEN #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 italic leading-relaxed">"{item.description || 'Sin descripción'}"</p>
                </div>
              </div>
            ))}
            {reportItems.length === 0 && (
              <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <FileText className="w-12 h-12 mb-2 opacity-10" />
                <p className="text-sm">Aún no hay imágenes guardadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;

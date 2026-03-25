
import React, { useState, useEffect, useRef } from 'react';
import { DB } from '../services/db';
import { Pet, DentalReport, ReportItem } from '../types';
import { ImagePlus, RotateCcw, FlipHorizontal, Save, FileText, CheckCircle2, ArrowLeft, Eye, Check, ClipboardList, Stethoscope, MessageSquare, Edit, Trash2, X, Pencil, Eraser, Search, Download, Undo } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReportBuilderProps {
  reportId?: string | null;
  onClose?: () => void;
}

type Language = 'es' | 'en';

const TRANSLATIONS = {
  es: {
    title: 'Reporte Odontológico',
    subtitle: 'Reporte Odontológico Completo',
    patient: 'Paciente',
    age: 'Edad',
    years: 'años',
    skull: 'Cráneo',
    clinicalHistory: 'Historia Clínica',
    recommendedTreatment: 'Tratamiento Recomendado',
    otherComments: 'Otros Comentarios',
    visualFindings: 'Imágenes y Hallazgos Visuales',
    technicalDescription: 'Descripción Técnica',
    noDescription: 'Sin descripción técnica.',
    createdThrough: 'Este documento fue creado a travez de',
    allRightsReserved: 'Todos los Derechos reservador',
    createdBy: 'Creado por',
    date: 'Fecha',
    startReport: 'Iniciar Reporte Médico',
    selectPatient: 'Seleccione un paciente para comenzar la evaluación dental',
    searchPatient: 'Buscar Paciente',
    searchPlaceholder: 'Escribe el nombre del paciente o clínica...',
    noPatientsFound: 'No se encontraron pacientes',
    startNewReport: 'Iniciar Nuevo Reporte',
    saveReport: 'Guardar Reporte',
    preview: 'Vista Previa',
    downloadPdf: 'Descargar PDF',
    historyPlaceholder: 'Describa la historia clínica relevante para este procedimiento...',
    addImage: 'Agregar Nueva Imagen',
    editImage: 'Editar Imagen',
    cancelEdit: 'Cancelar Edición',
    clickToUpload: 'Haga clic para subir una foto',
    mirrorEffect: 'Efecto Espejo',
    rotate90: 'Girar 90°',
    radiographicFindings: 'Hallazgos Radiográficos',
    technicalDescriptionPlaceholder: 'Describa los hallazgos dentales...',
    addImageToReport: 'Añadir Imagen al Reporte',
    saveChanges: 'Guardar Cambios',
    treatmentPlaceholder: 'Indique los pasos a seguir y recomendaciones terapéuticas...',
    commentsPlaceholder: 'Notas adicionales, advertencias o recordatorios...',
    accumulatedImages: 'Imágenes Acumuladas',
    imageNumber: 'IMAGEN',
    noImagesSaved: 'Aún no hay imágenes guardadas',
    savedSuccessfully: 'Cambios guardados correctamente',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    defaultTreatment: `Exodoncia (extracción) de piezas dentales no viables para detener la reabsorción ósea de maxila y mandíbulas y detener el dolor debido a la inflamación crónica, así como para prevenir enfermedad renal y endocarditis bacteriana debidos a la bacteriemia crónica que las piezas infectadas transmiten al torrente sanguíneo. 
Monitoreo radiográfico de piezas dentales con lesiones reportadas, para acompañar su evolución (cada 6 meses o cada año)
Uso de Maxiguard®️ gel, en su presentación con vitamina C en polvo. Aplicando una gota en la parte superior de cada colmillo maxilar. Cada 24 horas`,
    defaultComments: `Fueron extraídas 6 piezas dentales que presentaban más movilidad dental y mayor acúmulo de cálculo, sin embargo, otras 5 piezas generan dolor por exposición de raíces (hipersensibilidad dental).
Para reducir tiempos de anestésia se dio prioridad a las piezas con mayor reabsorción ósea.  
Fue aplicado barniz desensibilizante VOCO®️ Profluorid en todas las coronas y raíces para mitigar la hipersensibilidad del paciente cuando toma agua, traga saliva o jadea.  El efecto de dicho barniz cubre un periodo aproximado de 30 días. Este producto no es un tratamiento definitivo, es una medida paliativa mientras se retoma el procedimiento odontológico. 

La reabsorción dental es...

La ausencia bilateral de piezas...`,
    options: [
      { label: 'Reabsorción ósea exponiendo raíces de (rojo)', color: '#ef4444' },
      { label: 'Reabsorción dental en raíz mesial de (naranja)', color: '#f97316' },
      { label: 'Aumento de espacio ligamental en raíces de (amarillo)', color: '#eab308' },
      { label: 'sin alteraciones radiográficas aparentes anquilosis de raíz en (verde)', color: '#22c55e' },
      { label: 'Hallazgo en (azul)', color: '#275BF5' }
    ]
  },
  en: {
    title: 'Dental Report',
    subtitle: 'Complete Dental Report',
    patient: 'Patient',
    age: 'Age',
    years: 'years',
    skull: 'Skull',
    clinicalHistory: 'Clinical History',
    recommendedTreatment: 'Recommended Treatment',
    otherComments: 'Other Comments',
    visualFindings: 'Images and Visual Findings',
    technicalDescription: 'Technical Description',
    noDescription: 'No technical description.',
    createdThrough: 'This document was created through',
    allRightsReserved: 'All Rights Reserved',
    createdBy: 'Created by',
    date: 'Date',
    startReport: 'Start Medical Report',
    selectPatient: 'Select a patient to begin the dental evaluation',
    searchPatient: 'Search Patient',
    searchPlaceholder: 'Type patient name or clinic...',
    noPatientsFound: 'No patients found',
    startNewReport: 'Start New Report',
    saveReport: 'Save Report',
    preview: 'Preview',
    downloadPdf: 'Download PDF',
    historyPlaceholder: 'Describe the relevant clinical history for this procedure...',
    addImage: 'Add New Image',
    editImage: 'Edit Image',
    cancelEdit: 'Cancel Edition',
    clickToUpload: 'Click to upload a photo',
    mirrorEffect: 'Mirror Effect',
    rotate90: 'Rotate 90°',
    radiographicFindings: 'Radiographic Findings',
    technicalDescriptionPlaceholder: 'Describe dental findings...',
    addImageToReport: 'Add Image to Report',
    saveChanges: 'Save Changes',
    treatmentPlaceholder: 'Indicate steps to follow and therapeutic recommendations...',
    commentsPlaceholder: 'Additional notes, warnings or reminders...',
    accumulatedImages: 'Accumulated Images',
    imageNumber: 'IMAGE',
    noImagesSaved: 'No images saved yet',
    savedSuccessfully: 'Changes saved successfully',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    defaultTreatment: `Exodontia (extraction) of non-viable teeth to stop bone resorption of the maxilla and mandibles and stop pain due to chronic inflammation, as well as to prevent kidney disease and bacterial endocarditis due to chronic bacteremia that infected pieces transmit to the bloodstream.
Radiographic monitoring of teeth with reported lesions, to accompany their evolution (every 6 months or every year)
Use of Maxiguard®️ gel, in its presentation with vitamin C powder. Applying one drop on the upper part of each maxillary canine. Every 24 hours`,
    defaultComments: `6 teeth were extracted that presented more dental mobility and greater accumulation of calculus, however, another 5 pieces generate pain due to root exposure (dental hypersensitivity).
To reduce anesthesia times, priority was given to pieces with greater bone resorption.
VOCO®️ Profluorid desensitizing varnish was applied to all crowns and roots to mitigate the patient's hypersensitivity when drinking water, swallowing saliva or panting. The effect of said varnish covers a period of approximately 30 days. This product is not a definitive treatment, it is a palliative measure while the dental procedure is resumed.

Dental resorption is...

The bilateral absence of pieces...`,
    options: [
      { label: 'Bone resorption exposing roots of (red)', color: '#ef4444' },
      { label: 'Dental resorption in mesial root of (orange)', color: '#f97316' },
      { label: 'Increased ligamental space in roots of (yellow)', color: '#eab308' },
      { label: 'without apparent radiographic alterations root ankylosis in (green)', color: '#22c55e' },
      { label: 'Finding in (blue)', color: '#275BF5' }
    ]
  }
};

const ReportBuilder: React.FC<ReportBuilderProps> = ({ reportId, onClose }) => {
  const [language, setLanguage] = useState<Language>('es');
  const t = TRANSLATIONS[language];
  const DESCRIPTION_OPTIONS = t.options;
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
  const [strokes, setStrokes] = useState<{ color: string, points: { x: number, y: number }[] }[]>([]);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<{ x: number, y: number }[]>([]);
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
    const report = DB.createReport(selectedPetId, language);
    setCurrentReport(report);
    setReportItems([]);
    setClinicalHistory('');
    setRecommendedTreatment(t.defaultTreatment);
    setOtherComments(t.defaultComments);
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
    setCurrentStrokePoints([]);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStrokePoints.length > 0) {
      setStrokes(prev => [...prev, { color: selectedColor!, points: currentStrokePoints }]);
    }
    setIsDrawing(false);
    setCurrentStrokePoints([]);
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
    
    const point = { x: x * scaleX, y: y * scaleY };
    setCurrentStrokePoints(prev => [...prev, point]);

    ctx.lineWidth = 12.0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = selectedColor;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const undoLastStroke = () => {
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      
      // If it's the last stroke, clear the whole description as requested
      if (prev.length === 1) {
        setCurrentDescription('');
        redrawCanvas([]);
        return [];
      }

      const lastStroke = prev[prev.length - 1];
      const newStrokes = prev.slice(0, -1);
      redrawCanvas(newStrokes);
      
      // Check if any other stroke of the same color remains
      const colorStillExists = newStrokes.some(s => s.color === lastStroke.color);
      if (!colorStillExists) {
        const optionToRemove = DESCRIPTION_OPTIONS.find(opt => opt.color === lastStroke.color);
        if (optionToRemove) {
          setCurrentDescription(current => {
            const lines = current.split('\n');
            const filteredLines = lines.filter(line => line.trim() !== optionToRemove.label);
            return filteredLines.join('\n').trim();
          });
        }
      }
      
      return newStrokes;
    });
  };

  const redrawCanvas = (strokesList: { color: string, points: { x: number, y: number }[] }[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineWidth = 12.0;

    strokesList.forEach(stroke => {
      ctx.strokeStyle = stroke.color;
      ctx.beginPath();
      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      }
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentDescription(''); // Clear the text box when clearing all drawings
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

      const finalDescription = currentDescription.trim() || 'Sin descripción técnica.';

      const itemData = {
        reportId: currentReport.id,
        imageData: finalImageData,
        description: finalDescription,
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
      setStrokes([]);
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
    setStrokes([]); // Reset strokes for new edit session
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

  const generateReportHTML = (pet: Pet | undefined, report: DentalReport, items: ReportItem[], history: string, treatment: string, comments: string) => {
    // Filter out the 4th item if it has the specific text
    const filteredItems = [...items];
    const filterText = language === 'es' ? "Sin hallazgos extras para mostrar aquí" : "No extra findings to show here";
    if (filteredItems.length >= 4 && filteredItems[3].description === filterText) {
      filteredItems.splice(3, 1);
    }

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <title>${t.title} - ${pet?.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          @page { margin: 10mm; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 0; color: #1e293b; line-height: 1.4; font-size: 11pt; background: #fff; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 0; overflow: hidden; }
          
          .header { border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { margin: 0; color: #4f46e5; font-size: 20pt; font-weight: 800; }
          .header-meta { text-align: right; color: #64748b; font-size: 8.5pt; }
          
          .pet-info { margin-bottom: 10px; background: #f8fafc; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .pet-info div { display: flex; flex-direction: column; }
          
          .section-title { font-size: 10pt; font-weight: bold; color: #4f46e5; margin: 15px 0 5px 0; border-left: 4px solid #4f46e5; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .text-block { background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 10px; white-space: pre-wrap; font-size: 10pt; color: #334155; word-wrap: break-word; overflow-wrap: break-word; }
          
          .gallery { width: 100%; border-collapse: separate; border-spacing: 10px; margin-top: 5px; table-layout: fixed; }
          .gallery-item { width: 50%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; vertical-align: top; padding: 0; }
          .gallery-item.centered { margin: 0 auto; float: none; }
          
          .img-container { background: #fff; height: 220px; display: block; text-align: center; overflow: hidden; position: relative; width: 100%; }
          .img-container img { max-width: 95%; max-height: 95%; object-fit: contain; display: inline-block; margin-top: 2.5%; }
          .description { padding: 10px; font-size: 9pt; color: #475569; border-top: 1px solid #f1f5f9; background: #fff; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word; }
          
          .label { font-weight: bold; font-size: 7pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; display: block; }
          .value { font-weight: 600; font-size: 10pt; color: #1e293b; display: block; margin-bottom: 2px; }

          .signature-footer { margin-top: 30px; border-top: 2px solid #f1f5f9; padding-top: 15px; page-break-inside: avoid; }
          .signature-details { font-size: 9pt; color: #1e293b; margin-bottom: 15px; }
          .signature-details p { margin: 2px 0; line-height: 1.4; }
          
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
            <div style="float: left;">
              <h1 style="margin: 0; color: #4f46e5; font-size: 20pt; font-weight: 800;">OralPet Insight DX</h1>
              <p style="margin: 0; font-weight: 600; color: #64748b; font-size: 8.5pt;">${t.subtitle}</p>
            </div>
            <div class="header-meta" style="float: right;">
              <p>${new Date(report.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div style="clear: both;"></div>
          </div>

          <div class="pet-info">
            <div style="padding: 8px;">
              <span class="label">${t.patient}</span>
              <span class="value" style="display: block;">${pet?.name}</span>
              <span style="font-size: 8.5pt; color: #64748b;">${pet?.type} | ${pet?.breed} | ${t.skull}: ${pet?.skullType} | ${t.age}: ${pet?.age} ${t.years}</span>
            </div>
          </div>

          ${history ? `
            <div class="section-title">${t.clinicalHistory}</div>
            <div class="text-block">${history}</div>
          ` : ''}

          <div class="section-title">${t.visualFindings}</div>
          <table class="gallery">
            ${(() => {
              let rows = [];
              for (let i = 0; i < filteredItems.length; i += 2) {
                const item1 = filteredItems[i];
                const item2 = filteredItems[i + 1];
                
                if (item2) {
                  rows.push(`
                    <tr>
                      <td class="gallery-item">
                        <div class="img-container">
                          <img src="${item1.imageData}" style="transform: rotate(${item1.rotation}deg) scaleX(${item1.isMirrored ? -1 : 1})">
                        </div>
                        <div class="description">${item1.description || t.noDescription}</div>
                      </td>
                      <td class="gallery-item">
                        <div class="img-container">
                          <img src="${item2.imageData}" style="transform: rotate(${item2.rotation}deg) scaleX(${item2.isMirrored ? -1 : 1})">
                        </div>
                        <div class="description">${item2.description || t.noDescription}</div>
                      </td>
                    </tr>
                  `);
                } else {
                  // Centered single item
                  rows.push(`
                    <tr>
                      <td colspan="2" style="border: none; background: transparent; text-align: center; padding: 10px 0;">
                        <div class="gallery-item centered" style="width: 49%; display: inline-block; text-align: left;">
                          <div class="img-container">
                            <img src="${item1.imageData}" style="transform: rotate(${item1.rotation}deg) scaleX(${item1.isMirrored ? -1 : 1})">
                          </div>
                          <div class="description">${item1.description || t.noDescription}</div>
                        </div>
                      </td>
                    </tr>
                  `);
                }
              }
              return rows.join('');
            })()}
          </table>

          ${treatment ? `
            <div class="section-title">${t.recommendedTreatment}</div>
            <div class="text-block">${treatment}</div>
          ` : ''}

          ${comments ? `
            <div class="section-title">${t.otherComments}</div>
            <div class="text-block">${comments}</div>
          ` : ''}

          <div class="signature-footer">
            <div class="signature-details">
              <p>${language === 'es' ? 'MVZ. Especializada en odontología veterinaria por ANCLIVEPA, Sao Paulo, Brasil.' : 'DVM. Specialized in veterinary dentistry by ANCLIVEPA, Sao Paulo, Brazil.'}</p>
              <p style="font-size: 10pt; margin-top: 4px;"><strong>Thalia J. Chávez R.</strong></p>
              <p>${language === 'es' ? 'Cédula Profesional' : 'Professional License'}: 8061296</p>
              <p>Thaliachavez@gmail.com</p>
            </div>
            
            <div class="signature-credits">
              <p>${t.createdThrough} <strong>OralPet Insight DX</strong>, ${t.allRightsReserved}</p>
              <p>${t.createdBy} <strong>Incéntrica</strong> © 2026</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;

    const pet = pets.find(p => p.id === selectedPetId);
    const htmlContent = generateReportHTML(pet, currentReport, reportItems, clinicalHistory, recommendedTreatment, otherComments);

    const opt = {
      margin: 10,
      filename: `Reporte_Odontologico_${pet?.name || 'Paciente'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(htmlContent).set(opt).save();
  };

  const handlePreviewReport = () => {
    if (!currentReport) return;

    const pet = pets.find(p => p.id === selectedPetId);
    const htmlContent = generateReportHTML(pet, currentReport, reportItems, clinicalHistory, recommendedTreatment, otherComments);

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!currentReport) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-end">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-1 shadow-sm">
            <button
              onClick={() => setLanguage('es')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                language === 'es' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t.spanish}
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                language === 'en' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t.english}
            </button>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t.startReport}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.selectPatient}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 space-y-6 transition-all">
          <div className="space-y-2 relative">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.searchPatient}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
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
                  <div className="px-6 py-4 text-slate-500 text-center italic">{t.noPatientsFound}</div>
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
            {t.startNewReport}
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
          {t.savedSuccessfully}
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
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}: {selectedPet?.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{language === 'es' ? 'Clínica' : 'Clinic'}: {selectedPet?.clinicName} | {new Date(currentReport.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-1 shadow-sm mr-2">
            <button
              onClick={() => setLanguage('es')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'es' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={handleExplicitSave}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 border shadow-sm ${
              hasUnsavedChanges 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-800/50' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {t.saveReport}
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePreviewReport}
              disabled={reportItems.length === 0}
              className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              {t.preview}
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={reportItems.length === 0}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {t.downloadPdf}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Historia Clínica Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <ClipboardList className="w-4 h-4" />
              {t.clinicalHistory}
            </div>
            <textarea
              placeholder={t.historyPlaceholder}
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={clinicalHistory}
              onChange={e => { setClinicalHistory(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-6 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-indigo-500" />
                {editingItemId ? t.editImage : t.addImage}
              </h3>
              {editingItemId && (
                <button
                  onClick={handleCancelEdit}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  {t.cancelEdit}
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
                  <p className="text-slate-400 dark:text-slate-600 font-medium">{t.clickToUpload}</p>
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
                      { color: '#ef4444', label: language === 'es' ? 'Rojo' : 'Red' },
                      { color: '#f97316', label: language === 'es' ? 'Naranja' : 'Orange' },
                      { color: '#eab308', label: language === 'es' ? 'Amarillo' : 'Yellow' },
                      { color: '#22c55e', label: language === 'es' ? 'Verde' : 'Green' },
                      { color: '#275BF5', label: language === 'es' ? 'Azul' : 'Blue' }
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => {
                          setSelectedColor(selectedColor === c.color ? null : c.color);
                        }}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          selectedColor === c.color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={`${language === 'es' ? 'Dibujar en' : 'Draw in'} ${c.label}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={undoLastStroke}
                      disabled={strokes.length === 0}
                      className="p-2 text-slate-500 hover:text-indigo-500 transition-colors disabled:opacity-30"
                      title={language === 'es' ? "Deshacer último trazo" : "Undo last stroke"}
                    >
                      <Undo className="w-5 h-5" />
                    </button>
                    <button
                      onClick={clearCanvas}
                      disabled={strokes.length === 0}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors disabled:opacity-30"
                      title={language === 'es' ? "Limpiar todo" : "Clear all"}
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
                    {t.mirrorEffect}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t.rotate90}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t.radiographicFindings}</label>
                <div className="grid grid-cols-1 gap-2">
                  {DESCRIPTION_OPTIONS.map((opt) => (
                    <button 
                      key={opt.label} 
                      onClick={() => {
                        setCurrentDescription(prev => {
                          if (!prev.trim()) return opt.label;
                          if (prev.includes(opt.label)) return prev;
                          return `${prev}\n${opt.label}`;
                        });
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
                    >
                      <div 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t.technicalDescription}</label>
                <textarea
                  placeholder={t.technicalDescriptionPlaceholder}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
                  value={currentDescription}
                  onChange={e => setCurrentDescription(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSaveItem}
              disabled={!currentImage}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-5 h-5" />
              {editingItemId ? t.saveChanges : t.addImageToReport}
            </button>
          </div>

          {/* Tratamiento Recomendado Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <Stethoscope className="w-4 h-4" />
              {t.recommendedTreatment}
            </div>
            <textarea
              placeholder={t.treatmentPlaceholder}
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={recommendedTreatment}
              onChange={e => { setRecommendedTreatment(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>

          {/* Otros Comentarios Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 transition-all">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider">
              <MessageSquare className="w-4 h-4" />
              {t.otherComments}
            </div>
            <textarea
              placeholder={t.commentsPlaceholder}
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
              value={otherComments}
              onChange={e => { setOtherComments(e.target.value); setHasUnsavedChanges(true); }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase text-xs tracking-wider">
            {t.accumulatedImages}
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
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{t.imageNumber} #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title={language === 'es' ? "Editar" : "Edit"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title={language === 'es' ? "Eliminar" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 italic leading-relaxed">"{item.description || (language === 'es' ? 'Sin descripción' : 'No description')}"</p>
                </div>
              </div>
            ))}
            {reportItems.length === 0 && (
              <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <FileText className="w-12 h-12 mb-2 opacity-10" />
                <p className="text-sm">{t.noImagesSaved}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;

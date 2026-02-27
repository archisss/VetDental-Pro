
import React, { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Pet, Appointment } from '../types';
import { CalendarDays, Plus, Trash2, Clock, Edit2 } from 'lucide-react';

const AppointmentManagement: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fix: Explicitly type the formData state to allow all valid status options from the Appointment type
  const [formData, setFormData] = useState<{
    petId: string;
    date: string;
    time: string;
    service: string;
    status: Appointment['status'];
  }>({
    petId: '',
    date: '',
    time: '',
    service: 'Profilaxis Dental',
    status: 'Confirmado'
  });

  useEffect(() => {
    const loadData = async () => {
      const petsData = await DB.getPets();
      setPets(petsData);
      await refreshAppointments();
    };
    loadData();
  }, []);

  const refreshAppointments = async () => {
    const apps = await DB.getAppointments();
    setAppointments(apps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      petId: '',
      date: '',
      time: '',
      service: 'Profilaxis Dental',
      status: 'Confirmado'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPet = pets.find(p => p.id === formData.petId);
    if (!selectedPet) return;

    const appointmentData: any = {
      ...formData,
      petName: selectedPet.name,
      clinicName: selectedPet.clinicName
    };

    if (editingId) {
      appointmentData.id = editingId;
    }

    await DB.saveAppointment(appointmentData);
    await refreshAppointments();
    resetForm();
  };

  const handleEdit = (app: Appointment) => {
    setEditingId(app.id);
    setFormData({
      petId: app.petId,
      date: app.date,
      time: app.time,
      service: app.service,
      status: app.status
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta cita?')) {
      await DB.deleteAppointment(id);
      await refreshAppointments();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Agenda de Citas</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Programar Cita
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {editingId ? 'Editar Cita' : 'Nueva Cita Médica'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Paciente</label>
              <select
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                value={formData.petId}
                onChange={e => setFormData({ ...formData, petId: e.target.value })}
              >
                <option value="">-- Elige un paciente --</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.name} ({pet.clinicName})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Servicio</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                value={formData.service}
                onChange={e => setFormData({ ...formData, service: e.target.value })}
              >
                <option value="Profilaxis Dental">Profilaxis Dental</option>
                <option value="Extracción">Extracción</option>
                <option value="Cirugía Oral">Cirugía Oral</option>
                <option value="Consulta General">Consulta General</option>
                <option value="Urgencia">Urgencia</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha</label>
              <input
                type="date"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hora</label>
              <input
                type="time"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-all"
              >
                {editingId ? 'Actualizar Cita' : 'Confirmar Cita'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {appointments.length > 0 ? (
            appointments.map(app => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{app.petName} <span className="text-slate-400 dark:text-slate-500 font-normal">({app.clinicName})</span></h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {new Date(app.date).toLocaleDateString()} - {app.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                    {app.service}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(app)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Editar cita"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Eliminar cita"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay citas programadas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagement;

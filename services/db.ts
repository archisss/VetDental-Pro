
import { Pet, DentalReport, ReportItem, Appointment } from '../types';

const API_BASE = '/api';

export const DB = {
  // Pets
  getPets: async (): Promise<Pet[]> => {
    const res = await fetch(`${API_BASE}/pets`);
    return res.json();
  },
  savePet: async (pet: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> => {
    const newPet: Pet = {
      ...pet,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const res = await fetch(`${API_BASE}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPet)
    });
    return res.json();
  },

  // Reports
  getReports: async (): Promise<DentalReport[]> => {
    const res = await fetch(`${API_BASE}/reports`);
    return res.json();
  },
  getReportById: async (id: string): Promise<DentalReport | undefined> => {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) return undefined;
    return res.json();
  },
  getReportsByPet: async (petId: string): Promise<DentalReport[]> => {
    const res = await fetch(`${API_BASE}/pets/${petId}/reports`);
    return res.json();
  },
  saveReport: async (report: DentalReport): Promise<void> => {
    await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
  },
  createReport: (petId: string): DentalReport => {
    return {
      id: crypto.randomUUID(),
      petId,
      date: new Date().toISOString(),
      clinicalHistory: '',
      recommendedTreatment: '',
      otherComments: '',
      notes: ''
    };
  },

  // Report Items
  getReportItems: async (reportId: string): Promise<ReportItem[]> => {
    const res = await fetch(`${API_BASE}/reports/${reportId}/items`);
    return res.json();
  },
  saveReportItem: async (item: Omit<ReportItem, 'id'> | ReportItem): Promise<ReportItem> => {
    const newItem: ReportItem = {
      ...item,
      id: 'id' in item && item.id ? item.id : crypto.randomUUID()
    } as ReportItem;
    
    const res = await fetch(`${API_BASE}/report-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    return res.json();
  },
  deleteReportItem: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/report-items/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await fetch(`${API_BASE}/appointments`);
    return res.json();
  },
  saveAppointment: async (appointment: Appointment | Omit<Appointment, 'id'>): Promise<Appointment> => {
    const newAppointment: Appointment = {
      ...appointment,
      id: 'id' in appointment ? appointment.id : crypto.randomUUID()
    } as Appointment;
    
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppointment)
    });
    return res.json();
  },
  deleteAppointment: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE'
    });
  }
};

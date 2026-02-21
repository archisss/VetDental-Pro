
import { Pet, DentalReport, ReportItem, Appointment } from '../types';

const API_BASE = '/api';

export const DB = {
  // Pets
  getPets: async (): Promise<Pet[]> => {
    try {
      const res = await fetch(`${API_BASE}/pets`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching pets:', e);
      return [];
    }
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
    try {
      const res = await fetch(`${API_BASE}/reports`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching reports:', e);
      return [];
    }
  },
  getReportById: async (id: string): Promise<DentalReport | undefined> => {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`);
      if (!res.ok) return undefined;
      const data = await res.json();
      return data.error ? undefined : data;
    } catch (e) {
      console.error('Error fetching report by id:', e);
      return undefined;
    }
  },
  getReportsByPet: async (petId: string): Promise<DentalReport[]> => {
    try {
      const res = await fetch(`${API_BASE}/pets/${petId}/reports`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching reports by pet:', e);
      return [];
    }
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
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/items`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      // Ensure boolean values for frontend
      return items.map((item: any) => ({
        ...item,
        isMirrored: !!item.isMirrored
      }));
    } catch (e) {
      console.error('Error fetching report items:', e);
      return [];
    }
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
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching appointments:', e);
      return [];
    }
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

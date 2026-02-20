
import { Pet, DentalReport, ReportItem, Appointment, PetType } from '../types';

const STORAGE_KEYS = {
  PETS: 'vet_dental_pets',
  REPORTS: 'vet_dental_reports',
  ITEMS: 'vet_dental_items',
  APPOINTMENTS: 'vet_dental_appointments'
};

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DB = {
  // Pets
  getPets: (): Pet[] => getFromStorage(STORAGE_KEYS.PETS, []),
  savePet: (pet: Omit<Pet, 'id' | 'createdAt'>): Pet => {
    const pets = DB.getPets();
    const newPet: Pet = {
      ...pet,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.PETS, [...pets, newPet]);
    return newPet;
  },

  // Reports
  getReports: (): DentalReport[] => getFromStorage(STORAGE_KEYS.REPORTS, []),
  getReportById: (id: string): DentalReport | undefined => {
    return DB.getReports().find(r => r.id === id);
  },
  getReportsByPet: (petId: string): DentalReport[] => {
    return DB.getReports().filter(r => r.petId === petId);
  },
  saveReport: (report: DentalReport): void => {
    const reports = DB.getReports();
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
      saveToStorage(STORAGE_KEYS.REPORTS, reports);
    } else {
      saveToStorage(STORAGE_KEYS.REPORTS, [...reports, report]);
    }
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
  getReportItems: (reportId: string): ReportItem[] => {
    const allItems = getFromStorage<ReportItem[]>(STORAGE_KEYS.ITEMS, []);
    return allItems.filter(item => item.reportId === reportId);
  },
  saveReportItem: (item: Omit<ReportItem, 'id'> | ReportItem): ReportItem => {
    const allItems = getFromStorage<ReportItem[]>(STORAGE_KEYS.ITEMS, []);
    
    if ('id' in item && item.id) {
      const index = allItems.findIndex(i => i.id === item.id);
      if (index >= 0) {
        allItems[index] = item as ReportItem;
        saveToStorage(STORAGE_KEYS.ITEMS, allItems);
        return item as ReportItem;
      }
    }
    
    const newItem: ReportItem = {
      ...item,
      id: crypto.randomUUID()
    };
    saveToStorage(STORAGE_KEYS.ITEMS, [...allItems, newItem]);
    return newItem;
  },
  deleteReportItem: (id: string): void => {
    const allItems = getFromStorage<ReportItem[]>(STORAGE_KEYS.ITEMS, []);
    saveToStorage(STORAGE_KEYS.ITEMS, allItems.filter(item => item.id !== id));
  },
  
  // Appointments
  getAppointments: (): Appointment[] => getFromStorage(STORAGE_KEYS.APPOINTMENTS, []),
  saveAppointment: (appointment: Appointment | Omit<Appointment, 'id'>): Appointment => {
    const appointments = DB.getAppointments();
    
    if ('id' in appointment) {
      const index = appointments.findIndex(a => a.id === appointment.id);
      if (index >= 0) {
        appointments[index] = appointment as Appointment;
        saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
        return appointment as Appointment;
      }
    }
    
    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID()
    } as Appointment;
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, [...appointments, newAppointment]);
    return newAppointment;
  },
  deleteAppointment: (id: string): void => {
    const appointments = DB.getAppointments();
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments.filter(a => a.id !== id));
  }
};

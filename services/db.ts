
import { Pet, DentalReport, ReportItem, PetType } from '../types';

const STORAGE_KEYS = {
  PETS: 'vet_dental_pets',
  REPORTS: 'vet_dental_reports',
  ITEMS: 'vet_dental_items'
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
  saveReportItem: (item: Omit<ReportItem, 'id'>): ReportItem => {
    const allItems = getFromStorage<ReportItem[]>(STORAGE_KEYS.ITEMS, []);
    const newItem: ReportItem = {
      ...item,
      id: crypto.randomUUID()
    };
    saveToStorage(STORAGE_KEYS.ITEMS, [...allItems, newItem]);
    return newItem;
  },
  updateReportItem: (item: ReportItem): void => {
    const allItems = getFromStorage<ReportItem[]>(STORAGE_KEYS.ITEMS, []);
    const index = allItems.findIndex(i => i.id === item.id);
    if (index >= 0) {
      allItems[index] = item;
      saveToStorage(STORAGE_KEYS.ITEMS, allItems);
    }
  }
};

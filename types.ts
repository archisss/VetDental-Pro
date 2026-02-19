
export enum PetType {
  DOG = 'Perro',
  CAT = 'Gato',
  OTHER = 'Otro'
}

export interface Pet {
  id: string;
  ownerName: string;
  name: string;
  breed: string;
  age: number;
  type: PetType;
  medicalNotes: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reportId: string;
  imageData: string; // Base64
  description: string;
  rotation: number;
  isMirrored: boolean;
}

export interface DentalReport {
  id: string;
  petId: string;
  date: string;
  clinicalHistory: string;
  recommendedTreatment: string;
  otherComments: string;
  notes: string;
}

export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  date: string;
  time: string;
  service: string;
  status: 'Confirmado' | 'Pendiente' | 'Cancelado';
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'veterinarian';
}

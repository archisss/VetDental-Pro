
export enum PetType {
  CANINE = 'Canino',
  FELINE = 'Felino',
  RODENT = 'Roedor',
  PRIMATE = 'Primate',
  BIRD = 'Ave',
  OTHER = 'Otro'
}

export enum SkullType {
  MESOCEPHALIC = 'Mesocefálico',
  BRACHYCEPHALIC = 'Braquicefálico',
  DOLICHOCEPHALIC = 'Dolicoefálico'
}

export interface Pet {
  id: string;
  clinicName: string; // Formerly ownerName
  name: string;
  breed: string;
  age: number;
  type: PetType;
  skullType: SkullType;
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
  clinicName: string;
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

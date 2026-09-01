
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
  age: number; // Años
  ageMonths?: number; // Meses (por defecto 0)
  type: PetType;
  skullType: SkullType;
  createdAt: string;
}

export function formatPetAge(age: number | undefined = 0, ageMonths: number | undefined = 0, lang: 'es' | 'en' = 'es'): string {
  const years = Math.max(0, Number(age) || 0);
  const months = Math.max(0, Number(ageMonths) || 0);

  if (lang === 'en') {
    const yearStr = years === 1 ? '1 year' : `${years} years`;
    const monthStr = months === 1 ? '1 month' : `${months} months`;

    if (years > 0 && months > 0) {
      return `${yearStr} and ${monthStr}`;
    } else if (years > 0) {
      return yearStr;
    } else if (months > 0) {
      return monthStr;
    } else {
      return '0 years';
    }
  } else {
    const yearStr = years === 1 ? '1 año' : `${years} años`;
    const monthStr = months === 1 ? '1 mes' : `${months} meses`;

    if (years > 0 && months > 0) {
      return `${yearStr} y ${monthStr}`;
    } else if (years > 0) {
      return yearStr;
    } else if (months > 0) {
      return monthStr;
    } else {
      return '0 años';
    }
  }
}

export interface ReportItem {
  id: string;
  reportId: string;
  imageData: string; // Base64
  description: string;
  rotation: number;
  isMirrored: boolean;
  position?: number;
}

export interface DentalReport {
  id: string;
  petId: string;
  date: string;
  clinicalHistory: string;
  recommendedTreatment: string;
  otherComments: string;
  notes: string;
  language?: 'es' | 'en';
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
  role: 'admin' | 'assistant';
  password?: string;
}

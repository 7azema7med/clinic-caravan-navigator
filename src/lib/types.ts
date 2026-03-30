export type UserRole = 'student' | 'admin';
export type StudentAssignment = 'registration' | 'vitals' | 'clinic' | 'research';

export interface SwitchRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromAssignment: StudentAssignment;
  fromClinicId?: string;
  toUserId: string;
  toUserName: string;
  toAssignment: StudentAssignment;
  toClinicId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  studentCode?: string;
  password: string;
  fullName: string;
  role: UserRole;
  assignment?: StudentAssignment;
  assignedClinic?: string;
  loginTime?: string;
  isActive?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  nameAr: string;
  doctorName: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  ticketNumber: string;
  fullNameAr: string;
  age: number;
  phone?: string;
  mainComplaint: string;
  clinicId: string;
  clinicName: string;
  note?: string;
  referToVitals: boolean;
  referToResearch: boolean;
  registeredBy: string;
  registeredAt: string;

  // Vital signs
  vitalsCompleted: boolean;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  pulse?: number;
  pastHistory?: string;
  vitalsNote?: string;
  vitalsBy?: string;
  vitalsAt?: string;

  // Examination
  examined: boolean;
  diagnosis?: string;
  treatment?: string;
  investigation?: string;
  referral: boolean;
  referralNote?: string;
  examNote?: string;
  doctorSignature?: string;
  examStudentSignature?: string;
  examinedAt?: string;

  // Absent
  isAbsent?: boolean;
  absentAt?: string;
}

export interface VitalRanges {
  bp: {
    normalSysMax: number;
    normalDiaMax: number;
    elevatedSysMin: number;
    elevatedSysMax: number;
    highSysMin: number;
    highSysMax: number;
    highDiaMin: number;
    highDiaMax: number;
    veryHighSysMin: number;
    veryHighDiaMin: number;
    emergencySys: number;
    emergencyDia: number;
  };
  sugar: {
    low: number;
    normalMax: number;
    highMax: number;
    veryHigh: number;
  };
  pulse: {
    low: number;
    normalMax: number;
    highMax: number;
    veryHigh: number;
  };
}

export interface SystemSettings {
  registrationOpen: boolean;
  rotationTimeMinutes: number;
  vitalRanges: VitalRanges;
  researchQuestions: ResearchQuestion[];
  registrationFields: RegistrationField[];
}

export interface ResearchQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

export const DEFAULT_VITAL_RANGES: VitalRanges = {
  bp: {
    normalSysMax: 120,
    normalDiaMax: 80,
    elevatedSysMin: 120,
    elevatedSysMax: 129,
    highSysMin: 130,
    highSysMax: 139,
    highDiaMin: 80,
    highDiaMax: 89,
    veryHighSysMin: 140,
    veryHighDiaMin: 90,
    emergencySys: 180,
    emergencyDia: 120,
  },
  sugar: {
    low: 70,
    normalMax: 140,
    highMax: 199,
    veryHigh: 200,
  },
  pulse: {
    low: 60,
    normalMax: 100,
    highMax: 120,
    veryHigh: 120,
  },
};

export const DEFAULT_CLINICS: Clinic[] = [
  { id: '1', name: 'Pediatrics', nameAr: 'أطفال', doctorName: '', isActive: true },
  { id: '2', name: 'Internal Medicine', nameAr: 'باطنة', doctorName: '', isActive: true },
  { id: '3', name: 'Neurology', nameAr: 'مخ وأعصاب', doctorName: '', isActive: true },
  { id: '4', name: 'Dermatology', nameAr: 'جلدية', doctorName: '', isActive: true },
  { id: '5', name: 'ENT', nameAr: 'أنف وأذن وحنجرة', doctorName: '', isActive: true },
  { id: '6', name: 'Orthopedics', nameAr: 'عظام', doctorName: '', isActive: true },
  { id: '7', name: 'Ophthalmology', nameAr: 'رمد', doctorName: '', isActive: true },
  { id: '8', name: 'General Surgery', nameAr: 'جراحة عامة', doctorName: '', isActive: true },
];

export const ADMIN_USER: User = {
  id: 'admin-hazem',
  username: 'Hazrm',
  email: 'hazem@admin.com',
  studentCode: '23018123',
  password: '1232004',
  fullName: 'Hazem Ahmed',
  role: 'admin',
  isActive: true,
};

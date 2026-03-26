import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Clinic, SystemSettings, DEFAULT_VITAL_RANGES, DEFAULT_CLINICS } from '@/lib/types';

interface DataContextType {
  patients: Patient[];
  clinics: Clinic[];
  settings: SystemSettings;
  addPatient: (patient: Omit<Patient, 'id' | 'ticketNumber'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  getPatientByTicket: (ticket: string) => Patient | undefined;
  getPatientsByClinic: (clinicId: string) => Patient[];
  addClinic: (clinic: Omit<Clinic, 'id'>) => void;
  updateClinic: (id: string, updates: Partial<Clinic>) => void;
  deleteClinic: (id: string) => void;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  getNextTicketNumber: () => string;
  getClinicStats: () => { clinicId: string; clinicName: string; waiting: number; examined: number; total: number }[];
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

const DEFAULT_SETTINGS: SystemSettings = {
  registrationOpen: true,
  rotationTimeMinutes: 30,
  vitalRanges: DEFAULT_VITAL_RANGES,
  researchQuestions: [],
  registrationFields: [],
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinic_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('clinic_clinics');
    return saved ? JSON.parse(saved) : DEFAULT_CLINICS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('clinic_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => { localStorage.setItem('clinic_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinic_clinics', JSON.stringify(clinics)); }, [clinics]);
  useEffect(() => { localStorage.setItem('clinic_settings', JSON.stringify(settings)); }, [settings]);

  const getNextTicketNumber = useCallback((): string => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const todaysPatients = patients.filter(p => p.ticketNumber.startsWith(dateStr));
    const nextNum = todaysPatients.length + 1;
    return `${dateStr}-${String(nextNum).padStart(4, '0')}`;
  }, [patients]);

  const addPatient = useCallback((patientData: Omit<Patient, 'id' | 'ticketNumber'>): Patient => {
    const ticket = getNextTicketNumber();
    const patient: Patient = { ...patientData, id: crypto.randomUUID(), ticketNumber: ticket };
    setPatients(prev => [...prev, patient]);
    return patient;
  }, [getNextTicketNumber]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const getPatientByTicket = useCallback((ticket: string) => {
    return patients.find(p => p.ticketNumber === ticket);
  }, [patients]);

  const getPatientsByClinic = useCallback((clinicId: string) => {
    return patients.filter(p => p.clinicId === clinicId).sort((a, b) => 
      new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
    );
  }, [patients]);

  const addClinic = useCallback((clinicData: Omit<Clinic, 'id'>) => {
    setClinics(prev => [...prev, { ...clinicData, id: crypto.randomUUID() }]);
  }, []);

  const updateClinic = useCallback((id: string, updates: Partial<Clinic>) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteClinic = useCallback((id: string) => {
    setClinics(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateSettings = useCallback((updates: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const getClinicStats = useCallback(() => {
    return clinics.filter(c => c.isActive).map(clinic => {
      const clinicPatients = patients.filter(p => p.clinicId === clinic.id);
      return {
        clinicId: clinic.id,
        clinicName: `${clinic.nameAr} - ${clinic.name}`,
        waiting: clinicPatients.filter(p => !p.examined).length,
        examined: clinicPatients.filter(p => p.examined).length,
        total: clinicPatients.length,
      };
    });
  }, [clinics, patients]);

  return (
    <DataContext.Provider value={{ patients, clinics, settings, addPatient, updatePatient, getPatientByTicket, getPatientsByClinic, addClinic, updateClinic, deleteClinic, updateSettings, getNextTicketNumber, getClinicStats }}>
      {children}
    </DataContext.Provider>
  );
};

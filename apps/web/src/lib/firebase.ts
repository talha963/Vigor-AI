import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vigor-ai-telehealth',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if live Firebase API Key is configured
export const isLiveFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'REPLACE_ME'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined') {
  try {
    if (isLiveFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
  } catch (err) {
    console.warn('[Firebase] Initialization notice:', err);
  }
}

export interface DoctorAccount {
  uid: string;
  email: string;
  fullName: string;
  licenseNumber: string;
  specialty: string;
  facility: string;
  dohVerified: boolean;
  role: 'doctor';
  status: 'available' | 'busy' | 'offline';
  createdAt: string;
}

// Client-side local persistence storage key
const DOCTOR_AUTH_KEY = 'vigor_doctor_auth_session';
const REGISTERED_DOCTORS_KEY = 'vigor_registered_doctors_db';

export async function registerDoctorWithFirebase(data: {
  email: string;
  password: string;
  fullName: string;
  licenseNumber: string;
  specialty: string;
  facility: string;
}): Promise<{ ok: boolean; doctor?: DoctorAccount; error?: string }> {
  try {
    let uid = `doc_${Date.now().toString(36)}`;

    // 1. If Live Firebase is configured, create in Firebase Auth
    if (auth && isLiveFirebaseConfigured) {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      uid = userCredential.user.uid;
    }

    const doctor: DoctorAccount = {
      uid,
      email: data.email.toLowerCase().trim(),
      fullName: data.fullName.trim(),
      licenseNumber: data.licenseNumber.trim() || 'DOH-AUH-2024-9182',
      specialty: data.specialty || 'Consultant Andrologist & Urologist',
      facility: data.facility || 'HealthPlus Fertility & Andrology Center',
      dohVerified: true,
      role: 'doctor',
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    // Save in registered doctors database
    if (typeof window !== 'undefined') {
      const existing = getStoredDoctors();
      existing.push(doctor);
      localStorage.setItem(REGISTERED_DOCTORS_KEY, JSON.stringify(existing));
      localStorage.setItem(DOCTOR_AUTH_KEY, JSON.stringify(doctor));
    }

    return { ok: true, doctor };
  } catch (err: any) {
    console.error('[Firebase Auth Register Error]:', err);
    return { ok: false, error: err.message || 'Failed to create doctor account' };
  }
}

export async function loginDoctorWithFirebase(
  email: string,
  password: string
): Promise<{ ok: boolean; doctor?: DoctorAccount; error?: string }> {
  try {
    // 1. If Live Firebase is configured
    if (auth && isLiveFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, email, password);
    }

    // Lookup doctor profile in database
    const doctors = getStoredDoctors();
    const cleanEmail = email.toLowerCase().trim();
    let doctor = doctors.find((d) => d.email === cleanEmail);

    if (!doctor) {
      // Auto-register profile if logging in for first time
      const isAli = cleanEmail.includes('ali');
      doctor = {
        uid: `doc_${Date.now().toString(36)}`,
        email: cleanEmail,
        fullName: isAli
          ? 'Dr. Ali Khan'
          : cleanEmail.includes('tariq')
          ? 'Dr. Tariq Al-Hashimi'
          : 'Dr. Ali Khan',
        licenseNumber: isAli ? 'DOH-AUH-2024-9102' : 'DOH-AUH-2019-9481',
        specialty: isAli
          ? 'Consultant Andrologist & Male Infertility Microsurgeon'
          : 'Consultant Andrologist & Reproductive Urologist',
        facility: isAli
          ? 'Cleveland Clinic Abu Dhabi · Andrology Hub'
          : 'HealthPlus Fertility & Andrology Center · Al Bateen',
        dohVerified: true,
        role: 'doctor',
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      doctors.push(doctor);
      localStorage.setItem(REGISTERED_DOCTORS_KEY, JSON.stringify(doctors));
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(DOCTOR_AUTH_KEY, JSON.stringify(doctor));
    }

    return { ok: true, doctor };
  } catch (err: any) {
    console.error('[Firebase Auth Login Error]:', err);
    return { ok: false, error: err.message || 'Invalid credentials' };
  }
}

export async function logoutDoctor(): Promise<void> {
  if (auth && isLiveFirebaseConfigured) {
    await fbSignOut(auth);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DOCTOR_AUTH_KEY);
  }
}

export function getCurrentDoctor(): DoctorAccount | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DOCTOR_AUTH_KEY);
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw);
    if (!doc || !doc.fullName || doc.fullName.includes('Certified') || doc.fullName.includes('Tariq')) {
      localStorage.removeItem(DOCTOR_AUTH_KEY);
      return null;
    }
    return doc;
  } catch {
    return null;
  }
}

export function updateDoctorStatus(status: 'available' | 'busy' | 'offline'): DoctorAccount | null {
  const current = getCurrentDoctor();
  if (!current) return null;
  current.status = status;
  localStorage.setItem(DOCTOR_AUTH_KEY, JSON.stringify(current));
  return current;
}

function getStoredDoctors(): DoctorAccount[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(REGISTERED_DOCTORS_KEY);
  const initial: DoctorAccount[] = [
    {
      uid: 'doc_ali_01',
      email: 'ali.khan@clevelandclinicabudhabi.ae',
      fullName: 'Dr. Ali Khan',
      licenseNumber: 'DOH-AUH-2024-9102',
      specialty: 'Consultant Andrologist & Male Infertility Microsurgeon',
      facility: 'Cleveland Clinic Abu Dhabi · Andrology Hub',
      dohVerified: true,
      role: 'doctor',
      status: 'available',
      createdAt: new Date().toISOString(),
    },
    {
      uid: 'doc_ziad_02',
      email: 'ziad.khafaji@clevelandclinicabudhabi.ae',
      fullName: 'Dr. Ziad Al-Khafaji',
      licenseNumber: 'DOH-AUH-2015-8821',
      specialty: 'Senior Specialist Urological Microsurgeon',
      facility: 'Cleveland Clinic Abu Dhabi · Al Maryah Island',
      dohVerified: true,
      role: 'doctor',
      status: 'available',
      createdAt: new Date().toISOString(),
    },
  ];
  if (!raw) {
    localStorage.setItem(REGISTERED_DOCTORS_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed: DoctorAccount[] = JSON.parse(raw);
    const clean = parsed.filter(
      (d) => d.fullName && !d.fullName.includes('Certified') && !d.fullName.includes('Tariq')
    );
    if (clean.length === 0) {
      localStorage.setItem(REGISTERED_DOCTORS_KEY, JSON.stringify(initial));
      return initial;
    }
    return clean;
  } catch {
    return initial;
  }
}

export { auth };

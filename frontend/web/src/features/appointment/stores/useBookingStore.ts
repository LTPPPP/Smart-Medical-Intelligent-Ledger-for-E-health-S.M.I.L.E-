// ============================================================
// Booking Wizard – Shared Zustand Store
// ============================================================

import { create } from "zustand";
import { DOCTORS, SPECIALTIES } from "@/features/appointment/components/booking/bookingConstants";

// ── Types ──────────────────────────────────────────────────
export type PathType = "facility" | "specialty" | "doctor" | null;
export type AppointmentType = "in-person" | "phone" | "video";
export type PaymentTiming = "now" | "later";
export type BookingStep = 1 | 2 | 3 | 4;

export interface BookingState {
  // Navigation
  step: BookingStep;
  direction: 1 | -1;

  // Step 1 – Path Selection
  selectedPath: PathType;
  afterHours: boolean;
  selectedSpecialty: string | null;
  selectedDoctorId: number | null;

  // Step 2 – Date & Time
  viewYear: number;
  viewMonth: number;
  selectedDay: number | null;
  selectedTime: string | null;

  // Step 3 – Patient Info
  appointmentType: AppointmentType;
  preferredLanguage: string;
  chiefComplaint: string;
  doctorNotes: string;

  // Step 4 – Payment
  payTiming: PaymentTiming;
  cardNumber: string;
  expiry: string;
  cvv: string;

  // Actions
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: BookingStep) => void;
  setPath: (path: PathType) => void;
  setAfterHours: (v: boolean) => void;
  setSpecialty: (specialty: string | null) => void;
  setDoctorId: (id: number | null) => void;
  setViewMonth: (month: number) => void;
  setViewYear: (year: number) => void;
  setSelectedDay: (day: number | null) => void;
  setSelectedTime: (time: string | null) => void;
  setAppointmentType: (type: AppointmentType) => void;
  setPreferredLanguage: (lang: string) => void;
  setChiefComplaint: (text: string) => void;
  setDoctorNotes: (text: string) => void;
  setPayTiming: (timing: PaymentTiming) => void;
  setCardNumber: (v: string) => void;
  setExpiry: (v: string) => void;
  setCvv: (v: string) => void;
  resetBooking: () => void;

  // Computed helpers (functions, not state)
  getSelectedDoctor: () => (typeof DOCTORS)[number] | undefined;
  getFormattedDate: () => string;
  canProceedStep1: () => boolean;
  canProceedStep2: () => boolean;
  canProceedStep3: () => boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();

const initialState = {
  step: 1 as BookingStep,
  direction: 1 as 1 | -1,
  selectedPath: null as PathType,
  afterHours: false,
  selectedSpecialty: null as string | null,
  selectedDoctorId: null as number | null,
  viewYear: now.getFullYear(),
  viewMonth: now.getMonth(),
  selectedDay: null as number | null,
  selectedTime: null as string | null,
  appointmentType: "in-person" as AppointmentType,
  preferredLanguage: "English",
  chiefComplaint: "",
  doctorNotes: "",
  payTiming: "now" as PaymentTiming,
  cardNumber: "",
  expiry: "",
  cvv: "",
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  // ── Navigation ─────────────────────────────────────────
  goNext: () =>
    set((s) => {
      if (s.step >= 4) return s;
      return { step: (s.step + 1) as BookingStep, direction: 1 };
    }),

  goBack: () =>
    set((s) => {
      if (s.step <= 1) return s;
      return { step: (s.step - 1) as BookingStep, direction: -1 };
    }),

  goToStep: (step) => set((s) => ({ step, direction: step > s.step ? 1 : -1 })),

  // ── Step 1 ─────────────────────────────────────────────
  setPath: (selectedPath) => set({ selectedPath }),
  setAfterHours: (afterHours) => set({ afterHours }),
  setSpecialty: (selectedSpecialty) => set({ selectedSpecialty }),
  setDoctorId: (selectedDoctorId) => set({ selectedDoctorId }),

  // ── Step 2 ─────────────────────────────────────────────
  setViewMonth: (viewMonth) => set({ viewMonth }),
  setViewYear: (viewYear) => set({ viewYear }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  setSelectedTime: (selectedTime) => set({ selectedTime }),

  // ── Step 3 ─────────────────────────────────────────────
  setAppointmentType: (appointmentType) => set({ appointmentType }),
  setPreferredLanguage: (preferredLanguage) => set({ preferredLanguage }),
  setChiefComplaint: (chiefComplaint) => set({ chiefComplaint: chiefComplaint.slice(0, 500) }),
  setDoctorNotes: (doctorNotes) => set({ doctorNotes }),

  // ── Step 4 ─────────────────────────────────────────────
  setPayTiming: (payTiming) => set({ payTiming }),
  setCardNumber: (cardNumber) => set({ cardNumber }),
  setExpiry: (expiry) => set({ expiry }),
  setCvv: (cvv) => set({ cvv }),

  // ── Reset ──────────────────────────────────────────────
  resetBooking: () => set(initialState),

  // ── Computed ───────────────────────────────────────────
  getSelectedDoctor: () => {
    const { selectedDoctorId } = get();
    return DOCTORS.find((d) => d.id === selectedDoctorId);
  },

  getFormattedDate: () => {
    const { viewMonth, viewYear, selectedDay, selectedTime } = get();
    if (!selectedDay) return "";
    const datePart = `${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear}`;
    return selectedTime ? `${datePart} · ${selectedTime}` : datePart;
  },

  canProceedStep1: () => {
    const { selectedPath } = get();
    return selectedPath !== null;
  },

  canProceedStep2: () => {
    const { selectedDay, selectedTime } = get();
    return selectedDay !== null && selectedTime !== null;
  },

  canProceedStep3: () => {
    const { chiefComplaint } = get();
    return chiefComplaint.trim().length > 0;
  },
}));

// ── Selector hooks for optimal re-renders ──────────────────
export const useBookingStep = () => useBookingStore((s) => s.step);
export const useBookingDirection = () => useBookingStore((s) => s.direction);

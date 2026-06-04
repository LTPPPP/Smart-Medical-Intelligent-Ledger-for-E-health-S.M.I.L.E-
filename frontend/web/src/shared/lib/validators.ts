// ============================================================
// Shared Zod validation schemas
// Used with react-hook-form via @hookform/resolvers/zod
// ============================================================

import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9+\-() ]{8,15}$/.test(val),
        "Invalid phone number",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Appointment Schemas ─────────────────────────────────────

export const createAppointmentSchema = z.object({
  dentistId: z.string().min(1, "Please select a dentist"),
  clinicId: z.string().min(1, "Please select a clinic"),
  slotId: z.string().min(1, "Please select a time slot"),
  serviceId: z.string().min(1, "Please select a service"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CreateAppointmentFormData = z.infer<typeof createAppointmentSchema>;

// ─── Patient Schemas ─────────────────────────────────────────

export const patientProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().max(200).optional(),
  allergies: z.string().optional(),
});

export type PatientProfileFormData = z.infer<typeof patientProfileSchema>;

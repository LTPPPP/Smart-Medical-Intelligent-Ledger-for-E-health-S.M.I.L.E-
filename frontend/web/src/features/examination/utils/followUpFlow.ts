export interface FollowUpFormLike {
  appointment_date?: string | null;
  appointment_time?: string | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

interface FollowUpContext {
  sessionId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  clinicId?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  durationMinutes?: number | null;
}

interface BuildFollowUpPayloadInput {
  sessionId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  actorId: string;
  treatmentPlanId?: string | null;
  form: FollowUpFormLike;
}

export function getFollowUpFormBlocker({
  sessionId,
  patientId,
  doctorId,
  clinicId,
  appointmentDate,
  appointmentTime,
  durationMinutes,
}: FollowUpContext): string | null {
  if (!sessionId?.trim()) return 'Session is not loaded.';
  if (!patientId?.trim()) return 'Session has no patient.';
  if (!doctorId?.trim()) return 'Session has no doctor.';
  if (!clinicId?.trim()) return 'Session has no clinic.';
  if (!appointmentDate?.trim()) return 'Follow-up date is required.';
  if (!appointmentTime?.trim()) return 'Follow-up time is required.';
  if (!durationMinutes || durationMinutes < 5) {
    return 'Duration must be at least 5 minutes.';
  }
  return null;
}

export function buildFollowUpAppointmentPayload({
  sessionId,
  patientId,
  doctorId,
  clinicId,
  actorId,
  treatmentPlanId,
  form,
}: BuildFollowUpPayloadInput) {
  return {
    patient_id: patientId,
    doctor_id: doctorId,
    clinic_id: clinicId,
    appointment_date: form.appointment_date,
    appointment_time: form.appointment_time,
    duration_minutes: form.duration_minutes,
    appointment_type: 'follow_up',
    session_id: sessionId,
    ...(treatmentPlanId ? { treatment_plan_id: treatmentPlanId } : {}),
    created_by: actorId,
    ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
  };
}

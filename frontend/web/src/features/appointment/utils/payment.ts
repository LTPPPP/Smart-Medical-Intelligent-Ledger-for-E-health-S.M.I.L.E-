import type { Appointment, AppointmentRow } from '../types/appointment.type';

export const DEFAULT_PAYMENT_AMOUNT = 200000;

type PaymentAppointment = Partial<Appointment & AppointmentRow> & {
  clinic?: { clinic_name?: string };
  service?: { service_name?: string; base_price?: number | null };
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
};

export function normalizePaymentAppointment(appointment: PaymentAppointment) {
  const appointmentId = appointment.appointment_id ?? appointment.appointmentId ?? '';
  const appointmentCode = appointment.appointment_code ?? appointment.appointmentCode ?? appointmentId;
  const paymentStatus = String(
    appointment.payment_status ?? appointment.paymentStatus ?? 'unpaid',
  ).toLowerCase();
  const amount =
    asNumber(appointment.estimatedPrice) ??
    asNumber(appointment.service?.base_price) ??
    DEFAULT_PAYMENT_AMOUNT;

  return {
    appointmentId,
    appointmentCode,
    paymentStatus,
    serviceName: appointment.service?.service_name ?? appointment.serviceName ?? 'Dental service',
    doctorName: appointment.doctorName ?? (appointment.doctor_id ? `Doctor ${appointment.doctor_id.slice(0, 8)}` : 'Assigned doctor'),
    clinicName: appointment.clinic?.clinic_name ?? appointment.clinicName ?? 'SMILE clinic',
    amount,
    canPay: ['unpaid', 'pending'].includes(paymentStatus),
  };
}

export function extractPaymentUrl(response: unknown): string | null {
  const payload = response as {
    data?: { data?: { paymentUrl?: string }; paymentUrl?: string };
  };
  return payload.data?.data?.paymentUrl ?? payload.data?.paymentUrl ?? null;
}

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { usePatient } from '../hooks/usePatient';
import type { Patient } from '../types/patient.type';

interface PatientFormProps {
  patient?: Patient;
  onSuccess: (result: { id: string }) => void;
  onCancel: () => void;
}

type FormData = {
  full_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email: string;
  blood_type: string;
  address: string;
  insurance_number: string;
  insurance_provider: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  allergies_raw: string;
};

function toFormData(patient?: Patient): FormData {
  return {
    full_name: patient?.fullName ?? '',
    date_of_birth: patient?.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
    gender: patient?.gender ?? 'MALE',
    phone: patient?.phone ?? '',
    email: patient?.email ?? '',
    blood_type: patient?.bloodType ?? '',
    address: patient?.address ?? '',
    insurance_number: patient?.insuranceNumber ?? '',
    insurance_provider: patient?.insuranceProvider ?? '',
    emergency_contact_name: patient?.emergencyContact?.name ?? '',
    emergency_contact_phone: patient?.emergencyContact?.phone ?? '',
    emergency_contact_relationship: patient?.emergencyContact?.relationship ?? '',
    allergies_raw: (patient?.allergies ?? []).join(', '),
  };
}

const inputClass =
  'w-full min-h-[44px] px-4 bg-slate-100 border border-slate-200 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-teal-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_0_0_3px_rgba(14,140,128,0.2)] text-sm transition-all';
const inputErrorClass =
  'w-full min-h-[44px] px-4 bg-slate-100 border border-red-400 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-red-500 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),0_0_0_3px_rgba(239,68,68,0.2)] text-sm transition-all';
const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono mb-1';

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const isEdit = !!patient;
  const { createPatient, updatePatient, isCreatingPatient, isUpdatingPatient } = usePatient();
  const [form, setForm] = useState<FormData>(() => toFormData(patient));
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (key: keyof FormData, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.full_name.trim()) errs.full_name = 'Vui lòng nhập họ tên';
    if (!form.date_of_birth) errs.date_of_birth = 'Vui lòng chọn ngày sinh';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const allergies = form.allergies_raw
      ? form.allergies_raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const hasEmergencyContact =
      form.emergency_contact_name || form.emergency_contact_phone;

    const body: Record<string, unknown> = {
      full_name: form.full_name,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      phone: form.phone,
      email: form.email || undefined,
      blood_type: form.blood_type || undefined,
      address: form.address || undefined,
      insurance_number: form.insurance_number || undefined,
      insurance_provider: form.insurance_provider || undefined,
      allergies: allergies.length > 0 ? allergies : undefined,
      emergency_contact: hasEmergencyContact
        ? {
            name: form.emergency_contact_name,
            phone: form.emergency_contact_phone,
            relationship: form.emergency_contact_relationship,
          }
        : undefined,
    };

    try {
      if (isEdit && patient) {
        await updatePatient({ id: patient.id, body });
        onSuccess({ id: patient.id });
      } else {
        const result = await createPatient(body);
        onSuccess({ id: result.data.id });
      }
    } catch (err) {
      console.error('PatientForm submit error:', err);
    }
  };

  const isPending = isCreatingPatient || isUpdatingPatient;

  const field = (
    label: string,
    key: keyof FormData,
    opts?: {
      type?: string;
      required?: boolean;
      placeholder?: string;
      as?: 'select';
      options?: { value: string; label: string }[];
    },
  ) => (
    <div>
      <label className={labelClass}>
        {label}
        {opts?.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {opts?.as === 'select' ? (
        <select
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          className={errors[key] ? inputErrorClass : inputClass}
        >
          {opts.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={form[key]}
          placeholder={opts?.placeholder}
          onChange={(e) => set(key, e.target.value)}
          className={errors[key] ? inputErrorClass : inputClass}
        />
      )}
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <Icon icon="mdi:alert-circle-outline" width={12} />
          {errors[key]}
        </p>
      )}
    </div>
  );

  const SectionCard = ({
    icon,
    iconColor,
    title,
    children,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5">
      <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-none">
          <Icon icon={icon} width={18} className={iconColor} />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic Info */}
      <SectionCard icon="mdi:account" iconColor="text-teal-600" title="Thông tin cơ bản">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Họ và tên', 'full_name', { required: true, placeholder: 'Nguyễn Văn A' })}
          {field('Ngày sinh', 'date_of_birth', { type: 'date', required: true })}
          {field('Giới tính', 'gender', {
            as: 'select',
            options: [
              { value: 'MALE', label: 'Nam' },
              { value: 'FEMALE', label: 'Nữ' },
              { value: 'OTHER', label: 'Khác' },
            ],
          })}
          {field('Số điện thoại', 'phone', { required: true, placeholder: '0912 345 678' })}
          {field('Email', 'email', { type: 'email', placeholder: 'example@email.com' })}
          {field('Nhóm máu', 'blood_type', {
            as: 'select',
            options: [
              { value: '', label: 'Chưa xác định' },
              ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => ({
                value: b,
                label: b,
              })),
            ],
          })}
          <div className="md:col-span-2">
            {field('Địa chỉ', 'address', { placeholder: '123 Đường ABC, Quận 1, TP.HCM' })}
          </div>
        </div>
      </SectionCard>

      {/* Insurance */}
      <SectionCard icon="mdi:shield-check" iconColor="text-teal-600" title="Bảo hiểm y tế">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Số thẻ BHYT', 'insurance_number', { placeholder: 'DN4123456789' })}
          {field('Nhà cung cấp', 'insurance_provider', { placeholder: 'BHYT Nhà nước' })}
        </div>
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard icon="mdi:phone-alert" iconColor="text-teal-600" title="Liên hệ khẩn cấp">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {field('Họ tên', 'emergency_contact_name', { placeholder: 'Nguyễn Thị B' })}
          {field('Số điện thoại', 'emergency_contact_phone', { placeholder: '0901 234 567' })}
          {field('Mối quan hệ', 'emergency_contact_relationship', { placeholder: 'Vợ / Chồng / Con' })}
        </div>
      </SectionCard>

      {/* Allergies */}
      <SectionCard icon="mdi:alert-circle" iconColor="text-teal-600" title="Dị ứng">
        <div>
          <label className={labelClass}>Danh sách dị ứng (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            placeholder="VD: Penicillin, Aspirin, Hải sản..."
            value={form.allergies_raw}
            onChange={(e) => set('allergies_raw', e.target.value)}
            className={inputClass}
          />
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(14,140,128,0.55)] hover:brightness-105 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isPending && <Icon icon="line-md:loading-twotone-loop" width={18} />}
          {isEdit ? 'Cập nhật' : 'Tạo hồ sơ'}
        </button>
      </div>
    </form>
  );
}

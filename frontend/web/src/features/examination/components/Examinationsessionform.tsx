'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { useExamination } from '@/features/examination/hooks/useExamination';
import type { CreateExaminationSessionRequest } from '@/features/examination/types/examination.type';

interface ExaminationSessionFormProps {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ExaminationSessionForm = ({
  appointmentId,
  patientId,
  doctorId,
  clinicId,
  onSuccess,
  onCancel,
}: ExaminationSessionFormProps) => {
  const { createSession, isCreatingSession } = useExamination();

  const [formData, setFormData] = useState<CreateExaminationSessionRequest>({
    appointmentId,
    patientId,
    doctorId,
    clinicId,
    chiefComplaint: '',
    vitalSigns: {
      bloodPressure: '',
      pulse: undefined,
      temperature: undefined,
    },
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chiefComplaint.trim()) {
      alert('Please enter chief complaint');
      return;
    }

    try {
      await createSession(formData);
      onSuccess?.();
    } catch (error) {
      alert('Failed to create examination session');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon icon="mdi:clipboard-text" width={24} />
        New Examination Session
      </h3>

      {/* Chief Complaint */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Chief Complaint <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.chiefComplaint}
          onChange={(e) =>
            setFormData({ ...formData, chiefComplaint: e.target.value })
          }
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Patient's main concern or reason for visit..."
          required
        />
      </div>

      {/* Vital Signs */}
      <div className="mb-4">
        <h4 className="font-medium mb-3">Vital Signs</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Blood Pressure</label>
            <input
              type="text"
              value={formData.vitalSigns?.bloodPressure || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: {
                    ...formData.vitalSigns,
                    bloodPressure: e.target.value,
                  },
                })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="120/80"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Pulse (bpm)</label>
            <input
              type="number"
              value={formData.vitalSigns?.pulse || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: {
                    ...formData.vitalSigns,
                    pulse: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  },
                })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="72"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.vitalSigns?.temperature || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitalSigns: {
                    ...formData.vitalSigns,
                    temperature: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  },
                })
              }
              className="w-full border rounded-lg px-3 py-2"
              placeholder="36.5"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Any additional observations or notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isCreatingSession}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCreatingSession && (
            <Icon icon="line-md:loading-twotone-loop" width={20} />
          )}
          Start Examination
        </button>
      </div>
    </form>
  );
};

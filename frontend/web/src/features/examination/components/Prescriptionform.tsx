'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useExamination } from '@/features/examination/hooks/useExamination';
import type {
  CreatePrescriptionRequest,
  PrescriptionItem,
  MedicationRoute,
} from '@/features/examination/types/examination.type';

interface PrescriptionFormProps {
  sessionId: string;
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MEDICATION_ROUTES: { value: MedicationRoute; label: string }[] = [
  { value: 'ORAL', label: 'Oral' },
  { value: 'TOPICAL', label: 'Topical' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'INHALATION', label: 'Inhalation' },
  { value: 'OTHER', label: 'Other' },
];

// Common dental medications
const COMMON_MEDICATIONS = [
  {
    name: 'Amoxicillin 500mg',
    dosage: '1 tablet',
    frequency: '3 times/day',
    duration: '7 days',
    route: 'ORAL' as MedicationRoute,
  },
  {
    name: 'Metronidazole 250mg',
    dosage: '1 tablet',
    frequency: '3 times/day',
    duration: '5 days',
    route: 'ORAL' as MedicationRoute,
  },
  {
    name: 'Paracetamol 500mg',
    dosage: '1-2 tablets',
    frequency: 'As needed',
    duration: 'As needed',
    route: 'ORAL' as MedicationRoute,
  },
  {
    name: 'Ibuprofen 400mg',
    dosage: '1 tablet',
    frequency: '3 times/day',
    duration: '3-5 days',
    route: 'ORAL' as MedicationRoute,
  },
];

export const PrescriptionForm = ({
  sessionId,
  patientId,
  onSuccess,
  onCancel,
}: PrescriptionFormProps) => {
  const { createPrescription, isCreatingPrescription } = useExamination();

  const [items, setItems] = useState<Omit<PrescriptionItem, 'id'>[]>([
    {
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      route: 'ORAL',
      quantity: 1,
      instructions: '',
      warnings: '',
    },
  ]);

  const [notes, setNotes] = useState('');

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: 'ORAL',
        quantity: 1,
        instructions: '',
        warnings: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PrescriptionItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleQuickAdd = (medication: (typeof COMMON_MEDICATIONS)[0]) => {
    const newItem = {
      ...medication,
      quantity: 21, // Default quantity
      instructions: 'Take after meals',
      warnings: '',
    };
    setItems([...items, newItem]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.medicationName && item.dosage && item.frequency,
    );

    if (validItems.length === 0) {
      alert('Please add at least one medication');
      return;
    }

    try {
      const request: CreatePrescriptionRequest = {
        sessionId,
        patientId,
        items: validItems,
        notes,
      };

      await createPrescription(request);
      onSuccess?.();
    } catch (error) {
      alert('Failed to create prescription');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Icon icon="mdi:prescription" width={24} />
          Electronic Prescription
        </h3>

        {/* Quick Add Medications */}
        <div className="relative group">
          <button
            type="button"
            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Icon icon="mdi:lightning-bolt" width={16} />
            Quick Add
          </button>
          <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="p-2">
              <p className="text-xs text-gray-500 mb-2">Common medications:</p>
              {COMMON_MEDICATIONS.map((med, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickAdd(med)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors"
                >
                  {med.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Items */}
      <div className="space-y-4 mb-4">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 relative">
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Icon icon="mdi:close" width={20} />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Medication Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.medicationName}
                  onChange={(e) =>
                    handleUpdateItem(index, 'medicationName', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Amoxicillin 500mg"
                  required
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.dosage}
                  onChange={(e) =>
                    handleUpdateItem(index, 'dosage', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="1 tablet"
                  required
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.frequency}
                  onChange={(e) =>
                    handleUpdateItem(index, 'frequency', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="3 times/day"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) =>
                    handleUpdateItem(index, 'duration', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="7 days"
                />
              </div>

              {/* Route */}
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <select
                  value={item.route}
                  onChange={(e) =>
                    handleUpdateItem(
                      index,
                      'route',
                      e.target.value as MedicationRoute,
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {MEDICATION_ROUTES.map((route) => (
                    <option key={route.value} value={route.value}>
                      {route.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleUpdateItem(
                      index,
                      'quantity',
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Instructions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Instructions
                </label>
                <input
                  type="text"
                  value={item.instructions}
                  onChange={(e) =>
                    handleUpdateItem(index, 'instructions', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Take after meals"
                />
              </div>

              {/* Warnings */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Warnings
                </label>
                <input
                  type="text"
                  value={item.warnings}
                  onChange={(e) =>
                    handleUpdateItem(index, 'warnings', e.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Do not exceed recommended dose"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      <button
        type="button"
        onClick={handleAddItem}
        className="w-full border-2 border-dashed rounded-lg py-3 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mb-4"
      >
        <Icon icon="mdi:plus" width={20} />
        Add Another Medication
      </button>

      {/* General Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">General Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Stop medication if allergic reaction occurs..."
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
          disabled={isCreatingPrescription}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isCreatingPrescription && (
            <Icon icon="line-md:loading-twotone-loop" width={20} />
          )}
          Create Prescription
        </button>
      </div>
    </form>
  );
};

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ExaminationSessionForm } from '@/features/examination/components/Examinationsessionform';
import { ROUTES } from '@/shared/constants/routes';

function NewExaminationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [context, setContext] = useState({
    appointmentId: searchParams.get('appointmentId') ?? '',
    patientId: searchParams.get('patientId') ?? '',
    doctorId: searchParams.get('doctorId') ?? '',
    clinicId: searchParams.get('clinicId') ?? '',
  });
  const [showForm, setShowForm] = useState(
    Object.values(context).every((value) => Boolean(value)),
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <Icon icon="lucide:arrow-left" width={18} />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New examination session</h1>
          <p className="mt-1 text-sm text-gray-600">
            Link the clinical session to an appointment, patient, doctor, and clinic.
          </p>
        </div>

        {!showForm ? (
          <form
            className="space-y-4 border-y border-gray-200 bg-white py-6"
            onSubmit={(event) => {
              event.preventDefault();
              setShowForm(Object.values(context).every((value) => Boolean(value.trim())));
            }}
          >
            {(
              [
                ['appointmentId', 'Appointment ID'],
                ['patientId', 'Patient ID'],
                ['doctorId', 'Doctor ID'],
                ['clinicId', 'Clinic ID'],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">{label} *</span>
                <input
                  required
                  value={context[field]}
                  onChange={(event) =>
                    setContext((current) => ({ ...current, [field]: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Continue
              <Icon icon="lucide:arrow-right" width={17} />
            </button>
          </form>
        ) : (
          <ExaminationSessionForm
            {...context}
            onCancel={() => setShowForm(false)}
            onSuccess={() => router.push(ROUTES.EXAMINATIONS)}
          />
        )}
      </div>
    </main>
  );
}

export default function NewExaminationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-gray-500">Loading...</div>}>
      <NewExaminationForm />
    </Suspense>
  );
}

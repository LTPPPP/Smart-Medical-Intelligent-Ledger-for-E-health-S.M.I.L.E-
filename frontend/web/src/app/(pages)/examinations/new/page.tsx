'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExaminationSessionForm } from '@/features/examination/components/Examinationsessionform';

function NewExaminationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appointmentId = searchParams.get('appointmentId') ?? '';
  const patientId = searchParams.get('patientId') ?? '';
  const doctorId = searchParams.get('doctorId') ?? '';
  const clinicId = searchParams.get('clinicId') ?? '';

  if (!appointmentId || !patientId || !doctorId || !clinicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Missing Parameters</h2>
          <p className="text-gray-600 mb-4">
            Please access this page through the appointment details.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <ExaminationSessionForm
          appointmentId={appointmentId}
          patientId={patientId}
          doctorId={doctorId}
          clinicId={clinicId}
          onSuccess={() => router.back()}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function NewExaminationPage() {
  return (
    <Suspense>
      <NewExaminationContent />
    </Suspense>
  );
}

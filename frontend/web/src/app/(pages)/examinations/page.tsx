'use client';

import { useRouter } from 'next/navigation';

export default function ExaminationsPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Examinations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please select an examination from an appointment or patient record.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go Back
        </button>
      </section>
    </main>
  );
}

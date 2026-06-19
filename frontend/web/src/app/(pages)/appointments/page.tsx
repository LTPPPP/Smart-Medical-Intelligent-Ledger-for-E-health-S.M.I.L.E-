'use client';

import { useRouter } from 'next/navigation';

import { ROUTES } from '@/shared/constants/routes';

export default function AppointmentsPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Appointments are not available yet</h1>
        <p className="mt-2 text-sm text-gray-600">
          This screen is temporarily disabled while the appointment UI is being restored.
        </p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.PROFILE)}
          className="mt-5 rounded-lg bg-smile-primary px-4 py-2 text-sm font-semibold text-white hover:bg-smile-primary-dark"
        >
          Go to Profile
        </button>
      </section>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import { CreateAppointmentForm } from '@/features/appointment/components/CreateAppointmentForm';
import { BookingType, BOOKING_TYPE } from '@/features/appointment/constants/appointment.constant';
import { ROUTES } from '@/shared/constants/routes';

export default function NewAppointmentPage() {
  const router = useRouter();
  const {
    createByClinic,
    createBySpecialty,
    createByDoctor,
    createOutsideHours,
    isCreatingByClinic,
    isCreatingBySpecialty,
    isCreatingByDoctor,
    isCreatingOutsideHours,
  } = useAppointment();

  const [bookingType, setBookingType] = useState<BookingType>(BOOKING_TYPE.CLINIC);

  const handleSubmit = async (data: any) => {
    try {
      let result;
      
      switch (bookingType) {
        case BOOKING_TYPE.CLINIC:
          result = await createByClinic(data);
          break;
        case BOOKING_TYPE.SPECIALTY:
          result = await createBySpecialty(data);
          break;
        case BOOKING_TYPE.DOCTOR:
          result = await createByDoctor(data);
          break;
        case BOOKING_TYPE.OUTSIDE_HOURS:
          result = await createOutsideHours(data);
          break;
      }

      alert('Appointment created successfully!');
      router.push(ROUTES.APPOINTMENTS);
    } catch (error) {
      alert('Failed to create appointment');
    }
  };

  const isSubmitting =
    isCreatingByClinic || isCreatingBySpecialty || isCreatingByDoctor || isCreatingOutsideHours;

  const bookingOptions = [
    {
      type: BOOKING_TYPE.CLINIC,
      icon: 'mdi:hospital-building',
      title: 'Book by Clinic',
      description: 'Choose your preferred clinic',
    },
    {
      type: BOOKING_TYPE.SPECIALTY,
      icon: 'mdi:medical-bag',
      title: 'Book by Specialty',
      description: 'Select medical specialty',
    },
    {
      type: BOOKING_TYPE.DOCTOR,
      icon: 'mdi:doctor',
      title: 'Book by Doctor',
      description: 'Choose specific doctor',
    },
    {
      type: BOOKING_TYPE.OUTSIDE_HOURS,
      icon: 'mdi:clock-alert',
      title: 'Emergency Booking',
      description: 'Outside working hours',
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <Icon icon="mdi:arrow-left" width={20} />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-800">Book Appointment</h1>
          <p className="text-gray-600 mt-1">Choose how you&apos;d like to book your appointment</p>
        </div>

        {/* Booking Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {bookingOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => setBookingType(option.type)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                bookingType === option.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${option.highlight ? 'ring-2 ring-orange-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    option.highlight ? 'bg-orange-100' : 'bg-blue-100'
                  }`}
                >
                  <Icon
                    icon={option.icon}
                    width={24}
                    className={option.highlight ? 'text-orange-600' : 'text-blue-600'}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{option.title}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {bookingType === option.type && (
                  <Icon icon="mdi:check-circle" className="text-blue-600" width={24} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Appointment Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the information below to complete your booking
            </p>
          </div>

          <CreateAppointmentForm
            bookingType={bookingType}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
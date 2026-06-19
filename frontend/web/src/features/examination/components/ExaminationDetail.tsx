'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

import { useExamination } from '@/features/examination/hooks/useExamination';

import { DiagnosisForm } from '@/features/examination/components/Diagnosisform';
import { PrescriptionForm } from '@/features/examination/components/Prescriptionform';

interface ExaminationDetailProps {
  sessionId: string;
}

export const ExaminationDetail = ({ sessionId }: ExaminationDetailProps) => {
  const {
    useSessionById,
    useDiagnosesBySession,
    usePrescriptionBySession,
    completeSession,
    cancelSession,
  } = useExamination();

  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const {
    data: sessionData,
    isLoading: isLoadingSession,
    error: sessionError,
    refetch: refetchSession,
  } = useSessionById(sessionId);

  const {
    data: diagnosesData,
    isLoading: isLoadingDiagnoses,
    refetch: refetchDiagnoses,
  } = useDiagnosesBySession(sessionId);

  const {
    data: prescriptionData,
    isLoading: isLoadingPrescription,
    refetch: refetchPrescription,
  } = usePrescriptionBySession(sessionId);

  const session = sessionData?.data;
  const diagnoses = diagnosesData?.data || [];
  const prescription = prescriptionData?.data;

  const handleComplete = async () => {
    if (!confirm('Mark this examination as completed?')) return;

    try {
      await completeSession(sessionId);
      refetchSession();
    } catch (error) {
      alert('Failed to complete session');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this examination session?')) return;

    try {
      await cancelSession(sessionId);
      refetchSession();
    } catch (error) {
      alert('Failed to cancel session');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      MILD: 'bg-green-100 text-green-800',
      MODERATE: 'bg-yellow-100 text-yellow-800',
      SEVERE: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return (
      colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  if (isLoadingSession) {
    return <Loading text="Loading examination session..." />;
  }

  if (sessionError || !session) {
    return (
      <ErrorMessage
        message="Failed to load examination session"
        onRetry={refetchSession}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Examination Session</h2>
            <p className="text-gray-500 mt-1">Session ID: {session.id}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(session.status)}`}
          >
            {session.status}
          </span>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Chief Complaint</p>
            <p className="font-medium">{session.chiefComplaint}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date & Time</p>
            <p className="font-medium">
              {new Date(session.startTime).toLocaleString()}
              {session.endTime &&
                ` - ${new Date(session.endTime).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        {/* Vital Signs */}
        {session.vitalSigns && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Vital Signs</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {session.vitalSigns.bloodPressure && (
                <div>
                  <p className="text-xs text-gray-500">Blood Pressure</p>
                  <p className="font-medium">
                    {session.vitalSigns.bloodPressure}
                  </p>
                </div>
              )}
              {session.vitalSigns.pulse && (
                <div>
                  <p className="text-xs text-gray-500">Pulse</p>
                  <p className="font-medium">{session.vitalSigns.pulse} bpm</p>
                </div>
              )}
              {session.vitalSigns.temperature && (
                <div>
                  <p className="text-xs text-gray-500">Temperature</p>
                  <p className="font-medium">
                    {session.vitalSigns.temperature}°C
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-gray-700">{session.notes}</p>
          </div>
        )}

        {/* Actions */}
        {session.status === 'IN_PROGRESS' && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cancel Session
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete Session
            </button>
          </div>
        )}
      </div>

      {/* Diagnoses Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Diagnoses</h3>
          {session.status === 'IN_PROGRESS' && !showDiagnosisForm && (
            <button
              onClick={() => setShowDiagnosisForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:plus" width={20} />
              Add Diagnosis
            </button>
          )}
        </div>

        {showDiagnosisForm && (
          <div className="mb-4">
            <DiagnosisForm
              sessionId={sessionId}
              onSuccess={() => {
                setShowDiagnosisForm(false);
                refetchDiagnoses();
              }}
              onCancel={() => setShowDiagnosisForm(false)}
            />
          </div>
        )}

        {isLoadingDiagnoses ? (
          <Loading text="Loading diagnoses..." />
        ) : diagnoses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No diagnoses recorded yet
          </p>
        ) : (
          <div className="space-y-3">
            {diagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{diagnosis.description}</p>
                    <p className="text-sm text-gray-500">
                      ICD-10: {diagnosis.icdCode}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(diagnosis.severity)}`}
                  >
                    {diagnosis.severity}
                  </span>
                </div>

                {diagnosis.affectedTeeth &&
                  diagnosis.affectedTeeth.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">
                        Affected Teeth:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {diagnosis.affectedTeeth.map((tooth) => (
                          <span
                            key={tooth}
                            className="px-2 py-0.5 text-xs bg-gray-100 rounded"
                          >
                            {tooth}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {diagnosis.recommendedTreatment && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Recommended Treatment:
                    </p>
                    <p className="text-sm">{diagnosis.recommendedTreatment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Prescription</h3>
          {session.status === 'IN_PROGRESS' &&
            !prescription &&
            !showPrescriptionForm && (
              <button
                onClick={() => setShowPrescriptionForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Icon icon="mdi:plus" width={20} />
                Create Prescription
              </button>
            )}
        </div>

        {showPrescriptionForm && (
          <div className="mb-4">
            <PrescriptionForm
              sessionId={sessionId}
              patientId={session.patientId}
              onSuccess={() => {
                setShowPrescriptionForm(false);
                refetchPrescription();
              }}
              onCancel={() => setShowPrescriptionForm(false)}
            />
          </div>
        )}

        {isLoadingPrescription ? (
          <Loading text="Loading prescription..." />
        ) : !prescription ? (
          <p className="text-gray-500 text-center py-8">
            No prescription created yet
          </p>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <p className="font-medium">
                  Prescription Code: {prescription.prescriptionCode}
                </p>
                <p className="text-sm text-gray-500">
                  Created:{' '}
                  {new Date(prescription.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(prescription.status)}`}
              >
                {prescription.status}
              </span>
            </div>

            <div className="space-y-3">
              {prescription.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{item.medicationName}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Dosage</p>
                      <p>{item.dosage}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Frequency</p>
                      <p>{item.frequency}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p>{item.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantity</p>
                      <p>{item.quantity}</p>
                    </div>
                  </div>
                  {item.instructions && (
                    <p className="text-sm text-gray-600 mt-2">
                      <Icon
                        icon="mdi:information"
                        className="inline mr-1"
                        width={14}
                      />
                      {item.instructions}
                    </p>
                  )}
                  {item.warnings && (
                    <p className="text-sm text-orange-600 mt-1">
                      <Icon
                        icon="mdi:alert"
                        className="inline mr-1"
                        width={14}
                      />
                      {item.warnings}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {prescription.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  General Notes:
                </p>
                <p className="text-sm text-yellow-700">{prescription.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

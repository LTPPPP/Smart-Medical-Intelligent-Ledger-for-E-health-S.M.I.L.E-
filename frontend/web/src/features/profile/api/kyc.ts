import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

export interface KycStatus {
  kycId?: string;
  status: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  idType?: string;
  fullName?: string | null;
  dateOfBirth?: string | null;
  idNumberMasked?: string;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
}

export interface SubmitKycPayload {
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  idFront: File;
  idBack: File;
}

export const kycApi = {
  getMyKyc: async (): Promise<KycStatus> => {
    const { data } = await apiClient.get<KycStatus>(API_ENDPOINTS.KYC.ME);
    return data;
  },

  submitKyc: async (payload: SubmitKycPayload): Promise<KycStatus> => {
    const form = new FormData();
    form.append('idType', 'CITIZEN_ID');
    form.append('idNumber', payload.idNumber);
    form.append('fullName', payload.fullName);
    form.append('dateOfBirth', payload.dateOfBirth);
    form.append('consentAccepted', 'true');
    form.append('documentStorageConsentAccepted', 'true');
    form.append('ocrProcessingConsentAccepted', 'true');
    form.append('noMarketingConsentAccepted', 'true');
    form.append('consentVersion', 'kyc-consent-v1');
    form.append('retentionPolicyVersion', 'kyc-retention-v1');
    form.append('idFront', payload.idFront);
    form.append('idBack', payload.idBack);

    // Content-Type must be set to multipart/form-data (not the axios default json)
    // so axios v1.x skips FormDataSerializer.toJSON and passes FormData through;
    // the browser XHR layer then adds the correct boundary.
    const { data } = await apiClient.post<KycStatus>(API_ENDPOINTS.KYC.SUBMIT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

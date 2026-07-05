import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';

import { appointmentApi } from './appointment.api';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(apiClient.post);

describe('appointmentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends appointment reminders to the appointment-scoped endpoint', async () => {
    mockedPost.mockResolvedValueOnce({ data: { log_id: 'log-1' } });

    await appointmentApi.sendReminder({
      appointmentId: 'appointment-1',
      channels: ['APP'],
    });

    expect(mockedPost).toHaveBeenCalledWith(
      API_ENDPOINTS.APPOINTMENT.SEND_REMINDER('appointment-1'),
      { channels: ['APP'] },
    );
  });
});

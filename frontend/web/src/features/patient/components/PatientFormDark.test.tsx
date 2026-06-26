import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientFormDark } from './PatientFormDark';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

const getMock = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

describe('PatientFormDark', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('submits medical textareas as arrays accepted by the patient API', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <PatientFormDark
        submitLabel="Create patient"
        onSubmit={onSubmit}
        initial={{
          patient_code: 'PT-DEMO-09',
          full_name: 'Demo Patient',
          user_id: '11111111-1111-4111-8111-111111111111',
          allergies: 'No',
          chronic_diseases: 'Diabetes, hypertension',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: ['No'],
        chronic_diseases: ['Diabetes', 'hypertension'],
        user_id: '11111111-1111-4111-8111-111111111111',
      }),
    );
  });

  it('overwrites patient identity fields from the selected linked account', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    getMock.mockResolvedValue({
      data: {
        data: [{
          user_id: '11111111-1111-4111-8111-111111111111',
          full_name: 'Linked Patient',
          email: 'linked@example.com',
          phone: '0900000000',
          date_of_birth: '2001-02-03',
          gender: 'FEMALE',
          address: 'Linked address',
        }],
      },
    });

    render(
      <PatientFormDark
        submitLabel="Create patient"
        onSubmit={onSubmit}
        initial={{
          patient_code: 'PT-DEMO-10',
          full_name: 'Manual Name',
          email: 'manual@example.com',
          phone: '0911111111',
        }}
      />,
    );

    await user.type(screen.getByPlaceholderText(/search by registered email/i), 'linked@example.com');
    await user.click(screen.getByRole('button', { name: /search/i }));
    await user.click(await screen.findByText('Linked Patient'));
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      user_id: '11111111-1111-4111-8111-111111111111',
      full_name: 'Linked Patient',
      email: 'linked@example.com',
      phone: '0900000000',
      date_of_birth: '2001-02-03',
      gender: 'FEMALE',
      address: 'Linked address',
    }));
  });
});

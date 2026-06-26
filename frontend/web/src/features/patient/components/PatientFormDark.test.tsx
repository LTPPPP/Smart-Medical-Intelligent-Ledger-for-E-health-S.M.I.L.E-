import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PatientFormDark } from './PatientFormDark';

vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

describe('PatientFormDark', () => {
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
});

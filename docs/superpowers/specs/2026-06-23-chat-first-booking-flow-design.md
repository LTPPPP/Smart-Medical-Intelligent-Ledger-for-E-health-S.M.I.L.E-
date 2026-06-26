# Chat-First Booking Flow Design

## Goal

Make the SMILE scheduling assistant production-oriented without turning the chat into a heavy modal wizard. The assistant should guide booking, cancellation, and rescheduling through structured controls inside the chat, while the backend remains the source of truth for patient ownership, appointment state, doctor schedule, room assignment, and conflict checks.

## Chosen Approach

Use a chat-first picker with structured cards and buttons.

The chatbot asks natural follow-up questions when fields are missing, but users choose concrete resources through UI controls embedded in the conversation:

- service and clinic/date choices when the request is incomplete
- appointment cards for cancel/reschedule selection
- slot grids grouped by doctor, room, and clinic
- a final confirmation summary before any mutation

The old modal can remain as a helper entry point for simple guided input, but it must not be required for the core booking flow.

## Booking Flow

Minimum booking inputs are:

- `service`
- `preferred date`
- `clinic` when multiple clinics are available

Optional inputs are:

- `doctor`
- `time`
- chief complaint / notes

If the user does not choose a doctor, the system lists available `doctor + room + time` options from the backend. If the user chooses a doctor, options are filtered to that doctor's valid schedules.

The assistant must not auto-select the first slot. When multiple slots are available, it returns a slot picker and no global confirmation bar. After the user selects a specific slot, the assistant prepares a confirmation for that exact slot.

The final booking confirmation summary must include:

- service
- date and time
- duration
- doctor
- clinic
- room
- chief complaint / notes when provided

## Cancel Flow

Users should not need appointment IDs.

When the user asks to cancel, the assistant lists the patient's upcoming cancellable appointments as cards. Each card shows:

- appointment code when available
- service
- date and time
- duration
- doctor when available
- clinic
- room
- status

Each card has a `Cancel` action. Selecting one appointment prepares a confirmation for that appointment only. The mutation runs only after the user confirms.

## Reschedule Flow

Users should not need appointment IDs.

When the user asks to reschedule, the assistant lists upcoming reschedulable appointments as cards. Each card has a `Reschedule` action. After selection, the assistant searches slots using the old appointment's service, clinic, and doctor as preferences when available. The user may override date, doctor, clinic, or time through chat.

The final reschedule confirmation summary must show:

- current appointment date/time/doctor/room
- new date/time/doctor/room
- service
- clinic

## Business Rules

- Valid regular booking windows are `09:00-12:00` and `13:30-17:30`.
- Slots are generated from doctor schedules, not from hardcoded UI times.
- A doctor cannot have overlapping active appointments.
- Rooms are schedule resources. Multiple patients may have the same clock time only when the selected schedule uses a different doctor/room combination.
- Cancel and reschedule actions must only operate on appointments owned by the signed-in patient.
- The UI may display appointment codes, but users should not be forced to type them.

## Frontend Components

Keep the implementation inside the booking chat feature and avoid broad refactors.

Add focused render helpers/components for:

- `BookingSlotPicker`: groups options by `doctor_name • room_name • clinic_name`, shows slot buttons, and sends a structured selection message.
- `AppointmentActionList`: renders upcoming appointments with `Cancel` and `Reschedule` actions.
- `ConfirmationPanel`: appears only when a concrete mutation target is selected.

The assistant text should be concise when structured data is present. If a slot picker or appointment list is rendered, the generated text should not duplicate the full list in bullets.

## Backend/Agent Changes

The agent should expose safe structured state for frontend rendering:

- `booking_options`
- `booking_option`
- `appointments`
- selected appointment metadata for cancel/reschedule

The response generator should prefer brief copy when structured state already contains the actionable choices.

The deterministic fallback parser should extract ISO dates and `HH:MM` times so UI-generated selection messages do not rely entirely on the LLM.

## Error Handling

- If no appointments exist for cancel/reschedule, show a friendly empty state.
- If a selected slot becomes unavailable before confirmation, show a conflict message and re-run slot search.
- If backend services are unavailable, do not claim a booking or cancellation happened.
- If the user changes intent mid-flow, preserve conversation but clear stale confirmation.

## Testing

Backend tests:

- booking option selection honors time hints
- booking options include service, doctor, clinic, room, duration
- cancel/reschedule never mutate without confirmation
- appointment lookup returns enough fields for action cards

Frontend tests/lint:

- booking chat component lint passes
- slot picker renders without global confirmation when multiple options exist
- appointment cards can generate cancel/reschedule selection messages

Manual API verification:

- booking `Oral checking` on `2026-06-24` returns structured options
- selecting `10:30` prepares confirmation for `10:30`
- cancel/reschedule list only signed-in patient's appointments

## Non-Goals

- Payment flow
- KYC redesign
- Medical advice or diagnosis
- Seat-map style room visualization
- Full calendar management UI outside the chat widget

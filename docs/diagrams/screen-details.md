# SRS §3.1.b — Screen Details

<!-- GENERATED — python3 scripts/diagrams/gen_srs_tables.py -->

| # | Feature | Screen | Description |
|---|---|---|---|
| 1 | Authentication Management | Landing Page | Public home page introducing the clinic network and entry points to sign in or register. |
| 2 | Authentication Management | Login | Authenticate by email/phone and password and grant role-based access to the system. |
| 3 | Authentication Management | Register | Create a patient account with email/phone, password and OTP verification. |
| 4 | Authentication Management | Forgot Password | Request a password-reset code for the account email or phone. |
| 5 | Authentication Management | Reset Password | Verify the reset code and set a new password. |
| 6 | Authentication Management | Google Sign-in | Complete Google OAuth 2.0 sign-in and link the external identity to an account. |
| 7 | Authentication Management | Google OAuth Callback | Consume the authorization code returned by Google and establish the session. |
| 8 | Authentication Management | Unauthorized | Inform the signed-in user that their role may not access the requested screen. |
| 9 | Performance Management | Dashboard | Role-resolved landing workspace showing the operational summary for the signed-in user. |
| 10 | Performance Management | Doctor Dashboard | Clinical workspace: today's appointments, assigned patients and open examinations. |
| 11 | Performance Management | Patient Dashboard | Patient workspace: upcoming appointments, prescriptions and payment status. |
| 12 | User Management | Profile Page | View and update personal profile information, avatar and password. |
| 13 | Appointment Management | Booking Assistant | AI chat assistant that books and looks up appointments; available as a floating bubble across the app. |
| 14 | Appointment Management | Appointment List | Browse and filter appointments between patients and clinics. |
| 15 | Appointment Management | Create Appointment | Create an appointment by clinic, specialty or doctor and reserve the slot. |
| 16 | Appointment Management | Appointment Detail | Show one appointment with its status history, payment state and clinical links. |
| 17 | Appointment Management | Update Appointment | Modify appointment details, or request/confirm cancellation, and notify related parties. |
| 18 | Appointment Management | Payment | Process the appointment payment through the VNPay integration. |
| 19 | Appointment Management | Payment Result | Reconcile the VNPay callback and display the settled payment outcome. |
| 20 | Patient Management | Patient Directory | Browse and search the patient directory. |
| 21 | Patient Management | Add Patient Profile | Register a new patient profile with demographics and contact details. |
| 22 | Patient Management | Patient Profile | Show one patient with medical history, records, treatment history and representatives. |
| 23 | Patient Management | Update Patient Profile | Edit demographic and contact information of an existing patient. |
| 24 | Patient Management | Patient Images | Browse and attach dental images belonging to one patient. |
| 25 | Patient Management | Create Medical Record | Create a visit-level medical record linked to patient, clinic, doctor and appointment. |
| 26 | Patient Management | Medical Record Detail | Open one medical record with its versions, amendments, attachments and export action. |
| 27 | Clinic Examination | Examination List | Browse clinical examination sessions by clinic, doctor and status. |
| 28 | Clinic Examination | Create Examination | Open a new examination session for a patient from an appointment. |
| 29 | Clinic Examination | Examination Detail | Record symptoms, diagnoses, dental chart, treatment plan, prescription and clinical orders; finalize the session. |
| 30 | Dental Imaging | Dental Image Library | Browse, filter, upload and annotate dental images (X-ray, CBCT, endodontic) across patients. |
| 31 | Clinic Examination | Prescription List | Browse issued prescriptions for the signed-in patient or treating doctor. |
| 32 | Clinic Management | Clinic Page | Display the clinic network with overview information and operational details. |
| 33 | Clinic Management | Create Clinic | Register a new clinic branch. |
| 34 | Clinic Management | Clinic Detail | Show clinic profile, contact, specialties, treatment rooms and offered services. |
| 35 | Clinic Management | Update Clinic | Update clinic information, treatment rooms and configuration data. |
| 36 | Service Catalog Management | Service | Manage the dental service catalog and per-clinic availability and pricing. |
| 37 | Service Catalog Management | Add Service | Add a service to the catalog with category, duration and base price. |
| 38 | Service Catalog Management | Update Service | Update service definition, duration and base price. |
| 39 | Service Catalog Management | Specialty | Manage the clinical specialty catalog and its clinic assignments. |
| 40 | Schedule Management | Schedule Page | Scheduling hub for doctor shifts, leave and work-shift definitions. |
| 41 | Schedule Management | Doctor Schedule | View and manage published doctor schedules by date, clinic and room. |
| 42 | Schedule Management | Create Schedule | Create a doctor schedule entry, unique per doctor, date and shift. |
| 43 | Schedule Management | Update Schedule | Update or delete a schedule entry while it is still mutable, recording the change. |
| 44 | Schedule Management | Doctor Leave | Review and approve doctor leave that blocks availability. |
| 45 | Schedule Management | Request Leave | Submit a leave request for a date range with a reason. |
| 46 | Schedule Management | Work Shift | Maintain the named work-shift definitions used when building schedules. |
| 47 | Schedule Management | My Schedule | Show the signed-in doctor's or nurse's own shifts and request schedule changes. |
| 48 | User Management | Admin Home | Entry point to the administration area. |
| 49 | User Management | User Management Page | Administer user accounts, including ban and unban of policy-violating accounts. |
| 50 | User Management | Role Page | Manage role definitions and the permissions assigned to each role. |
| 51 | User Management | KYC Management | Review submitted identity documents and approve or reject verification. |
| 52 | User Management | Audit Log | Search the tamper-evident log of security and clinical data events. |
| 53 | Performance Management | Doctor Performance | Track doctor productivity and performance indicators and generate reports. |
| 54 | Performance Management | Financial Report | Report clinic revenue and payment settlement over a period. |
| 55 | Performance Management | Refund Management | Review, approve or reject refund requests raised against payments. |

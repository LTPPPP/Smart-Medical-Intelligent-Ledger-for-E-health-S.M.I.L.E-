"""Screen catalogue — the single source of truth shared by the SRS screen flow
diagrams, the §3.1.b Screen Details table and the §3.1.c Non-Screen Functions table.

Each screen names a real Next.js route. `verify()` fails if the catalogue and the
app router disagree in either direction, so a new page cannot silently escape the
SRS and a deleted page cannot linger in it. Role visibility is *not* stored here —
it is read from the ProtectedRoute guards by route_reader.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from route_reader import ROOT, list_routes  # noqa: E402


@dataclass(frozen=True)
class Screen:
    route: str
    feature: str
    name: str
    description: str
    parent: str | None = None   # route the user arrives from
    trigger: str = ""           # what the user does to get here
    guest_only: bool = False    # meaningless once signed in — kept out of the actor flows
    hide_from_guest: bool = False  # the sign-in chain: it opens each actor's flow, not the guest's
    guest_visible: bool = False    # the SRS grants Guest this screen even though the route is guarded


# Order defines the order of the SRS Screen Details table.
SCREENS: list[Screen] = [
    # ── Authentication ────────────────────────────────────────────────────────
    Screen("/", "Authentication Management", "Landing Page",
           "Public home page introducing the clinic network and entry points to sign in or register."),
    Screen("/login", "Authentication Management", "Login",
           "Authenticate by email/phone and password and grant role-based access to the system.",
           "/", 'Click "Login"', hide_from_guest=True),
    Screen("/register", "Authentication Management", "Register",
           "Create a patient account with email/phone, password and OTP verification.",
           "/", 'Click "Register"', guest_only=True),
    Screen("/forgot-password", "Authentication Management", "Forgot Password",
           "Request a password-reset code for the account email or phone.",
           "/login", 'Click "Forgot password"', hide_from_guest=True),
    Screen("/reset-password", "Authentication Management", "Reset Password",
           "Verify the reset code and set a new password.",
           "/forgot-password", 'Submit reset code', hide_from_guest=True),
    Screen("/google-callback", "Authentication Management", "Google Sign-in",
           "Complete Google OAuth 2.0 sign-in and link the external identity to an account.",
           "/login", 'Click "Continue with Google"', hide_from_guest=True),
    Screen("/auth/google/callback", "Authentication Management", "Google OAuth Callback",
           "Consume the authorization code returned by Google and establish the session.",
           "/google-callback", "Google redirect", hide_from_guest=True),
    Screen("/unauthorized", "Authentication Management", "Unauthorized",
           "Inform the signed-in user that their role may not access the requested screen.",
           "/dashboard", "Role check fails"),

    # ── Shell / profile ───────────────────────────────────────────────────────
    Screen("/dashboard", "Performance Management", "Dashboard",
           "Role-resolved landing workspace showing the operational summary for the signed-in user.",
           "/login", "Login successfully"),
    Screen("/dashboards/doctor", "Performance Management", "Doctor Dashboard",
           "Clinical workspace: today's appointments, assigned patients and open examinations.",
           "/dashboard", "Resolved for DOCTOR"),
    Screen("/dashboards/patient", "Performance Management", "Patient Dashboard",
           "Patient workspace: upcoming appointments, prescriptions and payment status.",
           "/dashboard", "Resolved for PATIENT"),
    Screen("/profile", "User Management", "Profile Page",
           "View and update personal profile information, avatar and password.",
           "/dashboard", 'Click "Profile"'),
    Screen("/chat", "Appointment Management", "Booking Assistant",
           "AI chat assistant that books and looks up appointments; available as a floating bubble across the app.",
           "/dashboard", 'Open the assistant bubble'),

    # ── Appointments ──────────────────────────────────────────────────────────
    Screen("/appointments", "Appointment Management", "Appointment List",
           "Browse and filter appointments between patients and clinics.",
           "/dashboard", 'Click "Appointments"'),
    Screen("/appointments/new", "Appointment Management", "Create Appointment",
           "Create an appointment by clinic, specialty or doctor and reserve the slot.",
           "/appointments", 'Click "Create"'),
    Screen("/appointments/[id]", "Appointment Management", "Appointment Detail",
           "Show one appointment with its status history, payment state and clinical links.",
           "/appointments", "Select an appointment"),
    Screen("/appointments/[id]/edit", "Appointment Management", "Update Appointment",
           "Modify appointment details, or request/confirm cancellation, and notify related parties.",
           "/appointments/[id]", 'Click "Edit"'),
    Screen("/appointments/[id]/payment", "Appointment Management", "Payment",
           "Process the appointment payment through the VNPay integration.",
           "/appointments/[id]", 'Click "Pay"'),
    Screen("/appointments/[id]/payment/callback", "Appointment Management", "Payment Result",
           "Reconcile the VNPay callback and display the settled payment outcome.",
           "/appointments/[id]/payment", "VNPay redirect"),

    # ── Patients ──────────────────────────────────────────────────────────────
    Screen("/patients", "Patient Management", "Patient Directory",
           "Browse and search the patient directory.",
           "/dashboard", 'Click "Patients"'),
    Screen("/patients/new", "Patient Management", "Add Patient Profile",
           "Register a new patient profile with demographics and contact details.",
           "/patients", 'Click "Add patient"'),
    Screen("/patients/[id]", "Patient Management", "Patient Profile",
           "Show one patient with medical history, records, treatment history and representatives.",
           "/patients", "Select a patient"),
    Screen("/patients/[id]/edit", "Patient Management", "Update Patient Profile",
           "Edit demographic and contact information of an existing patient.",
           "/patients/[id]", 'Click "Edit"'),
    Screen("/patients/[id]/images", "Patient Management", "Patient Images",
           "Browse and attach dental images belonging to one patient.",
           "/patients/[id]", 'Click "Images"'),
    Screen("/patients/[id]/medical-records/new", "Patient Management", "Create Medical Record",
           "Create a visit-level medical record linked to patient, clinic, doctor and appointment.",
           "/patients/[id]", 'Click "New record"'),
    Screen("/patients/[id]/medical-records/[recordId]", "Patient Management", "Medical Record Detail",
           "Open one medical record with its versions, amendments, attachments and export action.",
           "/patients/[id]", "Select a record"),

    # ── Examination ───────────────────────────────────────────────────────────
    Screen("/examinations", "Clinic Examination", "Examination List",
           "Browse clinical examination sessions by clinic, doctor and status.",
           "/dashboard", 'Click "Examinations"'),
    Screen("/examinations/new", "Clinic Examination", "Create Examination",
           "Open a new examination session for a patient from an appointment.",
           "/examinations", 'Click "New examination"'),
    Screen("/examinations/[id]", "Clinic Examination", "Examination Detail",
           "Record symptoms, diagnoses, dental chart, treatment plan, prescription and clinical orders; finalize the session.",
           "/examinations", "Select a session"),

    # ── Imaging / prescriptions ───────────────────────────────────────────────
    Screen("/dental-images", "Dental Imaging", "Dental Image Library",
           "Browse, filter, upload and annotate dental images (X-ray, CBCT, endodontic) across patients.",
           "/dashboard", 'Click "Imaging"'),
    Screen("/prescriptions", "Clinic Examination", "Prescription List",
           "Browse issued prescriptions for the signed-in patient or treating doctor.",
           "/dashboard", 'Click "Prescriptions"'),

    # ── Clinics ───────────────────────────────────────────────────────────────
    Screen("/clinics", "Clinic Management", "Clinic Page",
           "Display the clinic network with overview information and operational details.",
           "/dashboard", 'Click "Clinics"', guest_visible=True),
    Screen("/clinics/new", "Clinic Management", "Create Clinic",
           "Register a new clinic branch.",
           "/clinics", 'Click "Add clinic"'),
    Screen("/clinics/[id]", "Clinic Management", "Clinic Detail",
           "Show clinic profile, contact, specialties, treatment rooms and offered services.",
           "/clinics", 'Click a clinic card', guest_visible=True),
    Screen("/clinics/[id]/edit", "Clinic Management", "Update Clinic",
           "Update clinic information, treatment rooms and configuration data.",
           "/clinics/[id]", 'Click "Edit"'),

    # ── Catalog ───────────────────────────────────────────────────────────────
    Screen("/services", "Service Catalog Management", "Service",
           "Manage the dental service catalog and per-clinic availability and pricing.",
           "/dashboard", 'Click "Services"'),
    Screen("/services/new", "Service Catalog Management", "Add Service",
           "Add a service to the catalog with category, duration and base price.",
           "/services", 'Click "Add service"'),
    Screen("/services/[id]/edit", "Service Catalog Management", "Update Service",
           "Update service definition, duration and base price.",
           "/services", 'Click "Edit"'),
    Screen("/specialties", "Service Catalog Management", "Specialty",
           "Manage the clinical specialty catalog and its clinic assignments.",
           "/dashboard", 'Click "Specialties"', guest_visible=True),

    # ── Schedules ─────────────────────────────────────────────────────────────
    Screen("/schedules", "Schedule Management", "Schedule Page",
           "Scheduling hub for doctor shifts, leave and work-shift definitions.",
           "/dashboard", 'Click "Schedules"'),
    Screen("/schedules/doctors", "Schedule Management", "Doctor Schedule",
           "View and manage published doctor schedules by date, clinic and room.",
           "/schedules", 'Click "Doctor schedules"'),
    Screen("/schedules/doctors/new", "Schedule Management", "Create Schedule",
           "Create a doctor schedule entry, unique per doctor, date and shift.",
           "/schedules/doctors", 'Click "Create"'),
    Screen("/schedules/doctors/edit/[scheduleId]", "Schedule Management", "Update Schedule",
           "Update or delete a schedule entry while it is still mutable, recording the change.",
           "/schedules/doctors", 'Click "Edit"'),
    Screen("/schedules/leaves", "Schedule Management", "Doctor Leave",
           "Review and approve doctor leave that blocks availability.",
           "/schedules", 'Click "Leave"'),
    Screen("/schedules/leaves/new", "Schedule Management", "Request Leave",
           "Submit a leave request for a date range with a reason.",
           "/schedules/leaves", 'Click "Request leave"'),
    Screen("/schedules/shifts", "Schedule Management", "Work Shift",
           "Maintain the named work-shift definitions used when building schedules.",
           "/schedules", 'Click "Shifts"'),
    Screen("/schedules/my-schedule", "Schedule Management", "My Schedule",
           "Show the signed-in doctor's or nurse's own shifts and request schedule changes.",
           "/dashboard", 'Click "My schedule"'),

    # ── Administration ────────────────────────────────────────────────────────
    Screen("/admin", "User Management", "Admin Home",
           "Entry point to the administration area.",
           "/dashboard", 'Click "Administration"'),
    Screen("/admin/users-management", "User Management", "User Management Page",
           "Administer user accounts, including ban and unban of policy-violating accounts.",
           "/admin", 'Click "User management"'),
    Screen("/admin/roles-management", "User Management", "Role Page",
           "Manage role definitions and the permissions assigned to each role.",
           "/admin", 'Click "Role management"'),
    Screen("/admin/kyc-management", "User Management", "KYC Management",
           "Review submitted identity documents and approve or reject verification.",
           "/admin", 'Click "KYC management"'),
    Screen("/admin/audit-logs", "User Management", "Audit Log",
           "Search the tamper-evident log of security and clinical data events.",
           "/admin", 'Click "Audit logs"'),
    Screen("/admin/performance", "Performance Management", "Doctor Performance",
           "Track doctor productivity and performance indicators and generate reports.",
           "/admin", 'Click "Performance"'),
    Screen("/admin/revenue-reports", "Performance Management", "Financial Report",
           "Report clinic revenue and payment settlement over a period.",
           "/admin", 'Click "Revenue"'),
    Screen("/admin/refunds", "Performance Management", "Refund Management",
           "Review, approve or reject refund requests raised against payments.",
           "/admin", 'Click "Refunds"'),
]


@dataclass(frozen=True)
class SystemFunction:
    feature: str
    signature: str
    description: str
    source: str  # repo path that implements it — checked by verify()


# §3.1.c Non-Screen Functions — backend behaviour with no screen of its own.
SYSTEM_FUNCTIONS: list[SystemFunction] = [
    SystemFunction("Account management", "POST Auth RegisterUser(params)",
                   "Create a new account, validate unique email/phone/username, return JWT tokens.",
                   "backend/service/iam-service/src/auth"),
    SystemFunction("Account management", "POST Auth Login(params)",
                   "Authenticate by email/phone plus password and issue access and refresh tokens.",
                   "backend/service/iam-service/src/auth"),
    SystemFunction("Account management", "POST Auth RefreshToken(params)",
                   "Rotate the access token using a stored refresh token for session continuity.",
                   "backend/service/iam-service/src/refresh-tokens"),
    SystemFunction("Account management", "POST Auth SendOtp(params)",
                   "Issue a one-time passcode for phone/email verification or password reset.",
                   "backend/service/iam-service/src/otp-tokens"),
    SystemFunction("User administration", "GET Users GetAll(params)",
                   "Return the paginated user list with filters for administrative operations.",
                   "backend/service/iam-service/src/users"),
    SystemFunction("KYC verification", "POST KYC SubmitKyc(params)",
                   "Submit identity documents; files are stored AES-encrypted for the verification workflow.",
                   "backend/service/iam-service/src/kyc-verifications"),
    SystemFunction("KYC verification", "PUT KYC ApproveKyc(params)",
                   "Record the reviewer decision on a pending KYC request and update verification status.",
                   "backend/service/iam-service/src/kyc-verifications"),
    SystemFunction("AI KYC OCR", "POST KycOcr ExtractIdentityFields(params)",
                   "Extract CCCD fields from uploaded identity images (YOLOv11 + VietOCR) and return a KYC quality checklist.",
                   "ai/kyc_ocr_service"),
    SystemFunction("Appointment management", "POST Appointment CreateAtClinic(params)",
                   "Create a clinic appointment, enforce the no-double-booking exclusion constraints, and set status SCHEDULED.",
                   "backend/service/clinical-emr-service/src/appointments"),
    SystemFunction("Appointment management", "PUT Appointment Cancel(params)",
                   "Cancel an appointment with a reason and audit cancelled_by/cancelled_at.",
                   "backend/service/clinical-emr-service/src/appointments"),
    SystemFunction("Availability service", "GET Availability GetDoctorSlots(params)",
                   "Return the available time slots for a doctor on a given day.",
                   "backend/service/clinical-emr-service/src/doctor-schedules"),
    SystemFunction("Booking idempotency", "POST Appointment IdempotentSubmit(params)",
                   "Deduplicate repeated booking submissions through stored idempotency keys.",
                   "backend/service/clinical-emr-service/src/appointments/entities/idempotency-key.entity.ts"),
    SystemFunction("AI booking orchestration", "POST AIBooking CreateFromChat(params)",
                   "Convert an assistant conversation into a structured appointment booking request.",
                   "ai/booking_langgraph_service"),
    SystemFunction("Payment integration", "POST VNPay CreatePaymentUrl(params)",
                   "Build the signed VNPay checkout URL for an appointment payment.",
                   "backend/service/payment-service/src/payments"),
    SystemFunction("Payment integration", "GET VNPay Callback(params)",
                   "Verify the VNPay callback signature and reconcile payment status idempotently.",
                   "backend/service/payment-service/src/payments"),
    SystemFunction("Payment integration", "POST Payment Refund(params)",
                   "Raise a refund request and record its approval workflow against the payment.",
                   "backend/service/payment-service/src/payments"),
    SystemFunction("Reminder service (background)", "INTERVAL Reminder DispatchPendingReminders()",
                   "Periodically scan upcoming appointments and dispatch reminders, deduplicated per appointment, channel and start time.",
                   "backend/service/clinical-emr-service/src/appointments/appointment-reminder-scheduler.service.ts"),
    SystemFunction("Notification delivery", "POST Notification Send(params)",
                   "Deliver a notification through the APP, EMAIL, SMS or PUSH gateway and log the attempt.",
                   "backend/service/iam-service/src/notifications"),
    SystemFunction("Patient profile", "POST Patient CreatePatient(params)",
                   "Create the patient master profile with demographics, allergies and chronic conditions.",
                   "backend/service/clinical-emr-service/src/patients"),
    SystemFunction("Medical record", "POST MedicalRecord CreateRecord(params)",
                   "Create a visit record linked to patient, clinic, doctor and appointment.",
                   "backend/service/clinical-emr-service/src/medical-records"),
    SystemFunction("Medical record", "POST MedicalRecord Finalize(params)",
                   "Finalize a record, write an immutable snapshot to medical_record_versions, and emit an audit log entry.",
                   "backend/service/clinical-emr-service/src/medical-records/entities/medical-record-version.entity.ts"),
    SystemFunction("Record export", "POST RecordExport Create(params)",
                   "Generate an export file for a medical record and store it with an expiry.",
                   "backend/service/clinical-emr-service/src/record-exports"),
    SystemFunction("Imaging service", "POST Imaging UploadDentalImage(params)",
                   "Upload a dental image with metadata: category, tooth numbers and PACS identifier.",
                   "backend/service/clinical-emr-service/src/dental-images"),
    SystemFunction("PACS integration worker", "ASYNC PACS SyncImageJob(params)",
                   "Synchronize image records to the PACS server in the background and write pacs_sync_logs.",
                   "backend/service/clinical-emr-service/src/pacs-sync-logs"),
    SystemFunction("Schedule service", "POST Schedule CreateDoctorSchedule(params)",
                   "Create a doctor shift schedule, unique per doctor, date and shift.",
                   "backend/service/clinical-emr-service/src/doctor-schedules"),
    SystemFunction("Audit logging", "ASYNC Audit RecordEvent(params)",
                   "Append actor, action, timestamp and outcome for security and clinical data events.",
                   "backend/service/iam-service/src/audit-logs"),
    SystemFunction("Health monitoring", "GET Health Readiness(params)",
                   "Service readiness checks (database and connectivity) for orchestration and deployment probes.",
                   "backend/service/gateway-service/src/health/health.controller.ts"),

    # ── Operations invoked from a screen but having no screen of their own ────
    # These used to sit in §3.1.b as if they were screens, which is why the table
    # and the screen flow diagrams disagreed. They are actions on an existing
    # screen, so they belong here.
    SystemFunction("User administration", "PATCH Users Ban(userId)",
                   "Lock a user account that violates system policy, recording who banned it and why.",
                   "backend/service/iam-service/src/users"),
    SystemFunction("User administration", "PATCH Users Unban(userId)",
                   "Restore access to a previously banned account.",
                   "backend/service/iam-service/src/users"),
    SystemFunction("User administration", "PUT UserRoles Assign(userId)",
                   "Assign or revoke the roles held by a user.",
                   "backend/service/iam-service/src/user-roles"),
    SystemFunction("Role administration", "POST/PUT/DELETE Roles Manage(params)",
                   "Create a role, update the permissions attached to it, or delete one no longer required.",
                   "backend/service/iam-service/src/roles"),
    SystemFunction("Profile", "POST Accounts ConfirmAvatar(params)",
                   "Confirm an uploaded avatar against its signature and attach it to the account.",
                   "backend/service/iam-service/src/accounts/cloudinary.service.ts"),
    SystemFunction("Appointment management", "PUT Appointment Confirm(id)",
                   "Confirm a scheduled appointment and lock the reserved slot.",
                   "backend/service/clinical-emr-service/src/appointments"),
    SystemFunction("Payment integration", "PUT Payment ReviewRefund(id)",
                   "Approve or reject a pending refund request against a payment.",
                   "backend/service/payment-service/src/payments"),
    SystemFunction("Clinic examination", "POST Symptom/Diagnosis Manage(params)",
                   "Add, update or remove the symptoms and diagnoses recorded on an examination session.",
                   "backend/service/clinical-emr-service/src/symptoms"),
    SystemFunction("Clinic examination", "POST TreatmentPlan Manage(params)",
                   "Create, revise, delete or export a treatment plan while it is still editable.",
                   "backend/service/clinical-emr-service/src/treatment-plans"),
    SystemFunction("Clinic examination", "POST ClinicalOrder Create(params)",
                   "Raise an imaging, laboratory or clinical test order from an examination session.",
                   "backend/service/clinical-emr-service/src/clinical-orders"),
    SystemFunction("Dental imaging", "POST DentalImage Annotate(imageId)",
                   "Attach markup, measurements or notes to a stored dental image.",
                   "backend/service/clinical-emr-service/src/image-annotations"),
    SystemFunction("Service catalog", "POST/PUT/DELETE Specialty Manage(params)",
                   "Maintain the specialty catalog and its per-clinic assignments.",
                   "backend/service/clinical-emr-service/src/specialties"),
    SystemFunction("Clinic management", "POST/PUT/DELETE TreatmentRoom Manage(params)",
                   "Maintain treatment rooms, their type, equipment inventory and availability.",
                   "backend/service/clinical-emr-service/src/treatment-rooms"),
    SystemFunction("Schedule management", "POST ScheduleChange Request(params)",
                   "Submit a change against a published schedule and track its approval.",
                   "backend/service/clinical-emr-service/src/doctor-schedules"),
]


def verify() -> list[str]:
    """Return a list of problems; empty means the catalogue matches the repo."""
    problems: list[str] = []

    app_routes = set(list_routes())
    cat_routes = [s.route for s in SCREENS]
    dupes = {r for r in cat_routes if cat_routes.count(r) > 1}
    problems += ["duplicate catalogue entry: %s" % r for r in sorted(dupes)]
    problems += ["route in app but not in catalogue: %s" % r for r in sorted(app_routes - set(cat_routes))]
    problems += ["route in catalogue but not in app: %s" % r for r in sorted(set(cat_routes) - app_routes)]

    by_route = {s.route: s for s in SCREENS}
    for s in SCREENS:
        if s.parent and s.parent not in by_route:
            problems.append("%s has unknown parent %s" % (s.route, s.parent))

    for fn in SYSTEM_FUNCTIONS:
        if not os.path.exists(os.path.join(ROOT, fn.source)):
            problems.append("system function %r points at missing path %s" % (fn.signature, fn.source))

    return problems


if __name__ == "__main__":
    issues = verify()
    print("%d screens, %d system functions" % (len(SCREENS), len(SYSTEM_FUNCTIONS)))
    if issues:
        print("\nPROBLEMS:")
        for p in issues:
            print("  -", p)
        raise SystemExit(1)
    print("catalogue matches the app router")

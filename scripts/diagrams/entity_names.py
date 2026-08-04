"""SRS-facing names and one-line descriptions for the database tables.

The table list itself comes from database/**/schema.sql — this module only supplies
the prose. `check()` fails when a table has no description, so a new migration
cannot reach the SRS as an unnamed row.
"""

from __future__ import annotations

import re

# Tables whose SRS entity name is not just the singular CamelCase of the table.
NAME_OVERRIDES = {
    "users": "User",
    "medical_history": "MedicalHistory",
    "treatment_history": "TreatmentHistory",
    "appointment_status_history": "AppointmentStatusHistory",
    "diagnoses": "Diagnosis",
    "specialties": "Specialty",
    "clinic_specialties": "ClinicSpecialty",
    "doctor_specialties": "DoctorSpecialty",
    "service_categories": "ServiceCategory",
    "image_categories": "ImageCategory",
    "notification_push_subscriptions": "PushSubscription",
    "oauth_connections": "OAuthConnection",
    "kyc_verifications": "KycVerification",
    "pacs_sync_logs": "PacsSyncLog",
}

_PLURAL = [(r"ies$", "y"), (r"ses$", "s"), (r"s$", "")]


def entity_name(table: str) -> str:
    if table in NAME_OVERRIDES:
        return NAME_OVERRIDES[table]
    singular = table
    for pattern, repl in _PLURAL:
        if re.search(pattern, table):
            singular = re.sub(pattern, repl, table)
            break
    return "".join(part.capitalize() for part in singular.split("_"))


ENTITY_DESCRIPTIONS = {
    # auth_service_db
    "accounts": "Login credentials, primary role and account status",
    "oauth_connections": "Linked external identity provider accounts (Google, etc.)",
    "refresh_tokens": "Issued refresh tokens for session renewal and revocation",
    "otp_tokens": "One-time passcodes for phone/email verification and password reset",
    # account_service_db
    "users": "User profile: name, contact, date of birth, gender, avatar",
    "roles": "RBAC role definition",
    "permissions": "RBAC action/resource permission",
    "role_permissions": "Assignment of permissions to roles",
    "user_roles": "Assignment of roles to users",
    "phone_verifications": "Phone-number verification state per user",
    "kyc_verifications": "Identity verification workflow with AES-encrypted documents",
    "audit_logs": "Tamper-evident log of security and clinical data events",
    "notification_templates": "Reusable message templates per notification type and channel",
    "notification_preferences": "Per-user opt-in/opt-out settings by channel",
    "notifications": "In-app/push notification instance delivered to a user",
    "notification_delivery_logs": "Delivery attempts, status and provider responses",
    "notification_push_subscriptions": "Web push endpoints registered per device",
    # core_medical_service_db
    "patients": "Core patient demographic profile",
    "patient_representatives": "Guardian or legal representative authorized to act for a patient",
    "medical_history": "Historical conditions, allergies and medications by patient",
    "medical_records": "Visit-level clinical record; immutable once finalized",
    "medical_record_versions": "Version snapshots of a medical record for amendment tracking",
    "record_exports": "Generated record export files with expiry for patient/compliance download",
    "examination_sessions": "Clinical examination encounter",
    "examination_session_amendments": "Post-finalization corrections to an examination session",
    "symptoms": "Reported symptoms with body location, severity and onset",
    "diagnoses": "Diagnoses attached to an examination session",
    "dental_charts": "Per-tooth status and surface findings for a patient record",
    "image_categories": "Image classification taxonomy",
    "dental_images": "Uploaded diagnostic images",
    "image_annotations": "Markup and measurement comments on images",
    "pacs_sync_logs": "Synchronization attempts between stored images and the PACS server",
    "clinical_orders": "Lab/imaging order raised from an examination session",
    "lab_test_results": "Result values, units, reference ranges and abnormal flags for an order",
    "treatment_plans": "Therapy plan, steps, quote and patient consent",
    "treatment_history": "Performed procedures by tooth, with code, cost and status",
    "prescriptions": "Prescribed medications issued from a session",
    "prescription_items": "Medication lines in a prescription",
    # core_clinic_service_db
    "clinics": "Clinic branch metadata",
    "treatment_rooms": "Rooms in clinic branches, including equipment inventory",
    "specialties": "Clinical specialty taxonomy",
    "doctor_specialties": "Specialties held by each doctor",
    "clinic_specialties": "Specialties offered at each clinic branch",
    "work_shifts": "Named shift definitions with start and end times",
    "service_categories": "Grouping of dental services",
    "services": "Dental services catalog",
    "clinic_services": "Per-clinic service availability and pricing",
    "doctor_schedules": "Doctor shift schedule by date, clinic and room",
    "doctor_leaves": "Approved or requested leave blocking availability",
    "schedule_changes": "Audit trail of edits to a published schedule",
    "appointments": "Booking and attendance object",
    "appointment_status_history": "Status transition trail for an appointment",
    "appointment_reminder_preferences": "Reminder channels and lead time chosen per appointment",
    "appointment_notification_logs": "Reminder dispatch attempts, channel and delivery state",
    "diagnostic_orders": "Requested diagnostic study with priority, tooth/area and result summary",
    "idempotency_keys": "Deduplication keys preventing duplicate booking requests",
    # payment_service_db
    "payments": "Payment transaction with status, currency and gateway reference",
}


def check(table_names: list[str]) -> list[str]:
    missing = [t for t in table_names if t not in ENTITY_DESCRIPTIONS]
    stale = [t for t in ENTITY_DESCRIPTIONS if t not in table_names]
    return (
        ["table %r has no SRS description (add it to ENTITY_DESCRIPTIONS)" % t for t in missing]
        + ["ENTITY_DESCRIPTIONS has %r, which no schema.sql defines" % t for t in stale]
    )


if __name__ == "__main__":
    import sys, os

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from schema_reader import load_schema

    tables = [t.name for t in load_schema()]
    issues = check(tables)
    for t in tables:
        print("  %-34s %s" % (entity_name(t), ENTITY_DESCRIPTIONS.get(t, "<<MISSING>>")))
    if issues:
        print("\nPROBLEMS:")
        for i in issues:
            print("  -", i)
        raise SystemExit(1)
    print("\n%d entities, all described" % len(tables))

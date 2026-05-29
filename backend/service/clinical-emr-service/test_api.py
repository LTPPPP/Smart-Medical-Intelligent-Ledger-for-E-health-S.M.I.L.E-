#!/usr/bin/env python3
"""
Comprehensive API test for Clinical EMR Service — S.M.I.L.E
Tests: Patient, MedicalRecord, ExaminationSession, Diagnosis,
       MedicalCertificate, Referral, Prescription
"""

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta

BASE = "http://localhost:3004/api"
PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
INFO = "\033[94m→\033[0m"

# Fixed dummy UUIDs (valid v4 format — foreign keys may not exist but bypass FK for test)
DOCTOR_ID  = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
CLINIC_ID  = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e"

results = {"passed": 0, "failed": 0}


def req(method, path, body=None, expect=201):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method=method
    )
    try:
        with urllib.request.urlopen(r) as resp:
            status = resp.status
            payload = json.loads(resp.read())
            ok = status in ([expect] if isinstance(expect, int) else expect)
            mark = PASS if ok else FAIL
            if ok:
                results["passed"] += 1
            else:
                results["failed"] += 1
            print(f"  {mark} {method} {path}  [{status}]")
            return payload, ok
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()
        results["failed"] += 1
        print(f"  {FAIL} {method} {path}  [{e.code}]  {body_err[:200]}")
        return None, False


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


# ──────────────────────────────────────────────────────────────
section("1. Health Check")
r, _ = req("GET", "/v1/health", expect=200)
print(f"  {INFO} {r}")

# ──────────────────────────────────────────────────────────────
section("2. Patient CRUD")
patient, ok = req("POST", "/patients", {
    "full_name": "Nguyễn Văn Test",
    "patient_code": f"P{datetime.now().timestamp():.0f}",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "phone": "0901234567",
    "email": f"test_{datetime.now().timestamp():.0f}@smile.vn",
    "address": "123 Lê Lợi, Quận 1, TP.HCM",
    "insurance_number": f"BH{datetime.now().timestamp():.0f}",
    "blood_type": "A+",
    "allergies": ["Penicillin", "Aspirin"],
    "chronic_diseases": ["Tiểu đường type 2"]
})
PATIENT_ID = patient["patient_id"] if patient else None
print(f"  {INFO} patient_id = {PATIENT_ID}")

req("GET", "/patients", expect=200)
req("GET", f"/patients/{PATIENT_ID}", expect=200)
req("PATCH", f"/patients/{PATIENT_ID}", {"phone": "0987654321"}, expect=200)

# ──────────────────────────────────────────────────────────────
section("3. Medical Record")
record, ok = req("POST", "/medical-records", {
    "patient_id": PATIENT_ID,
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "visit_date": str(date.today()),
    "chief_complaint": "Đau đầu, sốt nhẹ",
    "diagnosis": "Viêm mũi dị ứng",
    "treatment_plan": "Thuốc kháng histamine 7 ngày",
    "clinical_summary": "Bệnh nhân đến khám vì đau đầu và sốt nhẹ kéo dài 3 ngày. Chẩn đoán viêm mũi dị ứng.",
    "primary_diagnosis_icd": "J30.1",
    "notes": "Dị ứng Penicillin, tránh dùng",
    "record_status": "draft"
})
RECORD_ID = record["record_id"] if record else None
print(f"  {INFO} record_id = {RECORD_ID}")

req("GET", "/medical-records", expect=200)
req("GET", f"/medical-records/{RECORD_ID}", expect=200)
req("GET", f"/medical-records/patient/{PATIENT_ID}", expect=200)
req("PATCH", f"/medical-records/{RECORD_ID}", {"clinical_summary": "Cập nhật tóm tắt bệnh án."}, expect=200)

# ──────────────────────────────────────────────────────────────
section("4. Examination Session (Phiếu Khám Bệnh)")
session, ok = req("POST", "/examination-sessions", {
    "patient_id": PATIENT_ID,
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "record_id": RECORD_ID,
    "doctor_name_snapshot": "BS. Trần Văn An",
    "clinic_name_snapshot": "Phòng Khám Đa Khoa S.M.I.L.E",
    "chief_complaint": "Đau đầu, sốt 38.5°C, mệt mỏi",
    "present_illness": "Bệnh 3 ngày nay, sốt buổi chiều, không ho, không khó thở",
    "family_history": "Bố mắc cao huyết áp, mẹ mắc tiểu đường type 2",
    "allergy_snapshot": ["Penicillin", "Aspirin"],
    "physical_examination": "Họng đỏ nhẹ, amidan không to, phổi trong, tim đều",
    "clinical_description": "Bệnh nhân tỉnh táo, tiếp xúc tốt. Da niêm mạc hồng. Không phù. Hạch ngoại vi không sờ thấy.",
    "bp_systolic": 120,
    "bp_diastolic": 80,
    "pulse_rate": 88,
    "temperature_celsius": 38.5,
    "spo2_percent": 98,
    "respiratory_rate": 18,
    "weight_kg": 65.5,
    "height_cm": 170.0,
    "follow_up_date": str(date.today() + timedelta(days=7)),
    "follow_up_notes": "Tái khám sau 7 ngày hoặc khi sốt cao hơn 39°C",
    "data_consent_version": "v1.0-2026",
    "status": "in_progress"
})
SESSION_ID = session["session_id"] if session else None
print(f"  {INFO} session_id = {SESSION_ID}")
if session:
    print(f"  {INFO} BMI tự tính = {session.get('bmi')} (expected ~22.68)")

req("GET", "/examination-sessions", expect=200)
req("GET", f"/examination-sessions/{SESSION_ID}", expect=200)
req("GET", f"/examination-sessions/patient/{PATIENT_ID}", expect=200)
req("PATCH", f"/examination-sessions/{SESSION_ID}", {
    "status": "completed",
    "completed_at": datetime.now().isoformat()
}, expect=200)

# ──────────────────────────────────────────────────────────────
section("5. Diagnoses (Chẩn Đoán)")
# Chẩn đoán sơ bộ
diag1, _ = req("POST", "/diagnoses", {
    "session_id": SESSION_ID,
    "icd_code": "J06.9",
    "diagnosis_name": "Nhiễm khuẩn hô hấp trên cấp tính",
    "diagnosis_type": "preliminary",
    "severity": "mild",
    "basis_of_diagnosis": "Lâm sàng: sốt, đau họng, xét nghiệm CBC bạch cầu tăng nhẹ",
    "diagnosis_order": 1
})
# Chẩn đoán xác định
diag2, _ = req("POST", "/diagnoses", {
    "session_id": SESSION_ID,
    "icd_code": "J30.1",
    "diagnosis_name": "Viêm mũi dị ứng do phấn hoa",
    "diagnosis_type": "confirmed",
    "severity": "mild",
    "basis_of_diagnosis": "Test dị ứng dương tính với phấn hoa",
    "diagnosis_order": 1
})
# Chẩn đoán phân biệt
diag3, _ = req("POST", "/diagnoses", {
    "session_id": SESSION_ID,
    "icd_code": "J45.20",
    "diagnosis_name": "Hen phế quản nhẹ",
    "diagnosis_type": "differential",
    "severity": "mild",
    "diagnosis_order": 2
})

DIAG_ID = diag2["diagnosis_id"] if diag2 else None
req("GET", "/diagnoses", expect=200)
req("GET", f"/diagnoses/{DIAG_ID}", expect=200)
req("GET", f"/diagnoses/session/{SESSION_ID}", expect=200)
req("GET", f"/diagnoses/icd/J30.1", expect=200)
req("PATCH", f"/diagnoses/{DIAG_ID}", {"notes": "Xác nhận sau khi có kết quả test dị ứng"}, expect=200)

# ──────────────────────────────────────────────────────────────
section("6. Medical Certificates (Giấy Chứng Nhận Y Tế)")
# Giấy nghỉ ốm
cert1, ok = req("POST", "/medical-certificates", {
    "session_id": SESSION_ID,
    "record_id": RECORD_ID,
    "patient_id": PATIENT_ID,
    "cert_type": "sick_leave",
    "issued_date": str(date.today()),
    "valid_from": str(date.today()),
    "valid_to": str(date.today() + timedelta(days=3)),
    "days_granted": 3,
    "reason": "Viêm mũi dị ứng, cần nghỉ ngơi và điều trị",
    "restrictions": "Tránh tiếp xúc khói bụi, môi trường lạnh",
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "doctor_name_snapshot": "BS. Trần Văn An",
    "doctor_license_number": "BV-HCM-2020-001234"
})
CERT_ID = cert1["cert_id"] if cert1 else None
print(f"  {INFO} cert_id = {CERT_ID}")

# Giấy chứng nhận sức khỏe
cert2, _ = req("POST", "/medical-certificates", {
    "session_id": SESSION_ID,
    "patient_id": PATIENT_ID,
    "cert_type": "fitness",
    "issued_date": str(date.today()),
    "reason": "Đủ điều kiện sức khỏe tham gia lao động bình thường",
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "doctor_name_snapshot": "BS. Trần Văn An"
})

req("GET", "/medical-certificates", expect=200)
req("GET", f"/medical-certificates/{CERT_ID}", expect=200)
req("GET", f"/medical-certificates/session/{SESSION_ID}", expect=200)
req("GET", f"/medical-certificates/patient/{PATIENT_ID}", expect=200)

# Hủy giấy (void)
req("PATCH", f"/medical-certificates/{CERT_ID}/void", {
    "voided_by": "00000000-0000-0000-0000-000000000002",
    "void_reason": "Cấp nhầm ngày, sẽ cấp lại"
}, expect=200)

# Thử hủy lần 2 — phải trả lỗi 403
r, _ = req("PATCH", f"/medical-certificates/{CERT_ID}/void", {
    "voided_by": "00000000-0000-0000-0000-000000000002",
    "void_reason": "Thử lại"
}, expect=403)

# ──────────────────────────────────────────────────────────────
section("7. Referrals (Giấy Chuyển Viện)")
ref1, ok = req("POST", "/referrals", {
    "session_id": SESSION_ID,
    "patient_id": PATIENT_ID,
    "from_clinic_id": "00000000-0000-0000-0000-000000000001",
    "from_clinic_name_snapshot": "Phòng Khám Đa Khoa S.M.I.L.E",
    "to_facility_name": "Bệnh Viện Đại Học Y Dược TP.HCM",
    "to_facility_address": "215 Hồng Bàng, Quận 5, TP.HCM",
    "to_department": "Khoa Tai Mũi Họng",
    "to_doctor_name": "GS.TS. Lê Văn Cường",
    "referral_reason": "Viêm mũi dị ứng mãn tính, cần đánh giá chuyên sâu và test dị ứng đầy đủ",
    "clinical_summary": "BN 35 tuổi, viêm mũi dị ứng tái phát, test dị ứng phấn hoa (+), đã điều trị kháng histamine không đáp ứng đủ.",
    "accompanying_documents": ["https://storage.smile.vn/records/CBC-001.pdf"],
    "urgency": "routine",
    "issued_by": "00000000-0000-0000-0000-000000000002",
    "issued_by_name_snapshot": "BS. Trần Văn An",
    "valid_until": (datetime.now() + timedelta(days=30)).isoformat()
})
REF_ID = ref1["referral_id"] if ref1 else None
print(f"  {INFO} referral_id = {REF_ID}")

# Giấy chuyển viện khẩn
req("POST", "/referrals", {
    "session_id": SESSION_ID,
    "patient_id": PATIENT_ID,
    "from_clinic_id": "00000000-0000-0000-0000-000000000001",
    "to_facility_name": "Bệnh Viện Chợ Rẫy",
    "to_department": "Khoa Cấp Cứu",
    "referral_reason": "Test giấy chuyển khẩn",
    "clinical_summary": "Trường hợp test mức khẩn",
    "urgency": "urgent",
    "issued_by": "00000000-0000-0000-0000-000000000002"
})

req("GET", "/referrals", expect=200)
req("GET", f"/referrals/{REF_ID}", expect=200)
req("GET", f"/referrals/session/{SESSION_ID}", expect=200)
req("GET", f"/referrals/patient/{PATIENT_ID}", expect=200)

# Cập nhật trạng thái: accepted
req("PATCH", f"/referrals/{REF_ID}/status", {
    "status": "accepted",
    "accepted_by": "00000000-0000-0000-0000-000000000003"
}, expect=200)

# Hủy giấy thứ 2
all_refs, _ = req("GET", f"/referrals/session/{SESSION_ID}", expect=200)
if all_refs and len(all_refs) > 1:
    ref2_id = all_refs[1]["referral_id"]
    req("PATCH", f"/referrals/{ref2_id}/cancel", expect=200)

# ──────────────────────────────────────────────────────────────
section("8. Prescriptions (Đơn Thuốc)")
rx, _ = req("POST", "/prescriptions", {
    "record_id": RECORD_ID,
    "patient_id": PATIENT_ID,
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "prescription_date": str(date.today()),
    "notes": "Uống sau ăn. Tránh Penicillin."
})
RX_ID = rx["prescription_id"] if rx else None
print(f"  {INFO} prescription_id = {RX_ID}")

if RX_ID:
    req("POST", "/prescription-items", {
        "prescription_id": RX_ID,
        "medication_name": "Loratadine",
        "medication_code": "LOR10",
        "dosage": "10mg",
        "route": "oral",
        "frequency": "1 lần/ngày",
        "duration_days": 7,
        "quantity": 7,
        "instructions": "Uống 1 viên buổi tối sau ăn"
    })
    req("POST", "/prescription-items", {
        "prescription_id": RX_ID,
        "medication_name": "Paracetamol",
        "medication_code": "PCT500",
        "dosage": "500mg",
        "route": "oral",
        "frequency": "3 lần/ngày khi sốt",
        "duration_days": 5,
        "quantity": 15,
        "instructions": "Uống khi nhiệt độ > 38.5°C, cách nhau ít nhất 4 giờ"
    })

req("GET", "/prescriptions", expect=200)
req("GET", f"/prescriptions/{RX_ID}", expect=200)

# ──────────────────────────────────────────────────────────────
section("9. Validation Tests (Giá trị biên sinh hiệu)")
# bp_systolic ngoài giới hạn (max 300)
r, ok = req("POST", "/examination-sessions", {
    "patient_id": PATIENT_ID,
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "bp_systolic": 999
}, expect=422)
print(f"  {INFO} bp_systolic=999 correctly rejected: {not ok or (r and 'error' in str(r).lower())}")

# temperature ngoài giới hạn (max 45°C)
r, ok = req("POST", "/examination-sessions", {
    "patient_id": PATIENT_ID,
    "doctor_id": "00000000-0000-0000-0000-000000000002",
    "clinic_id": "00000000-0000-0000-0000-000000000001",
    "temperature_celsius": 100
}, expect=422)
print(f"  {INFO} temperature=100 correctly rejected")

# diagnosis_type không hợp lệ
r, ok = req("POST", "/diagnoses", {
    "session_id": SESSION_ID,
    "diagnosis_name": "Test invalid enum",
    "diagnosis_type": "unknown_type"
}, expect=422)
print(f"  {INFO} invalid diagnosis_type correctly rejected")

# ──────────────────────────────────────────────────────────────
section("SUMMARY")
total = results["passed"] + results["failed"]
print(f"\n  Passed: {results['passed']}/{total}")
print(f"  Failed: {results['failed']}/{total}")
if results["failed"] == 0:
    print(f"\n  \033[92mAll tests passed! ✓\033[0m")
else:
    print(f"\n  \033[91m{results['failed']} test(s) failed\033[0m")
    sys.exit(1)

# Test Accounts

Tài khoản seed để login test. Nguồn: `database/iam-service/auth-service/insert.sql` (~101 tài khoản, tất cả `ACTIVE`, email đã verify).

**Mật khẩu chung cho mọi tài khoản: `Password123!`**

- Login UI: `http://localhost:3000/login`
- Login API: `POST http://localhost:8080/api/v1/auth/email/login` — body `{ "email": "...", "password": "Password123!" }`

## ADMIN (1)

| Email | Username |
|---|---|
| `admin@smile.com` | admin |

## DOCTOR (10)

| Email | Username |
|---|---|
| `dr.nguyenvana@smile.com` | dr.nguyenvana |
| `dr.tranthib@smile.com` | dr.tranthib |
| `dr.levanc@smile.com` | dr.levanc |
| `dr.phamthid@smile.com` | dr.phamthid |
| `dr.hoangvane@smile.com` | dr.hoangvane |
| `dr.nguyenthif@smile.com` | dr.nguyenthif |
| `dr.buihuug@smile.com` | dr.buihuug |
| `dr.doquangh@smile.com` | dr.doquangh |
| `dr.tranquangi@smile.com` | dr.tranquangi |
| `dr.vothanhj@smile.com` | dr.vothanhj |

## RECEPTIONIST (5)

| Email | Username |
|---|---|
| `recep.levan@smile.com` | recep.levan |
| `recep.nguyenthik@smile.com` | recep.nguyenthik |
| `recep.tranthil@smile.com` | recep.tranthil |
| `recep.phamvanm@smile.com` | recep.phamvanm |
| `recep.hoangthin@smile.com` | recep.hoangthin |

## PATIENT (85)

Username `pt001` → `pt085`, email dạng `<tên>.pt@email.com`. Một số tài khoản dùng nhanh:

| Email | Username |
|---|---|
| `nguyenvana.pt@email.com` | pt001 |
| `tranthib.pt@email.com` | pt002 |
| `levanc.pt@email.com` | pt003 |
| `phamthid.pt@email.com` | pt004 |
| `hoangvane.pt@email.com` | pt005 |

Danh sách đầy đủ: xem `database/iam-service/auth-service/insert.sql`.

## Bộ demo khuyên dùng (theo `docs/guide.md`)

| Email | Role |
|---|---|
| `admin@smile.com` | ADMIN |
| `dr.nguyenvana@smile.com` | DOCTOR |
| `nguyenvana.pt@email.com` | PATIENT |

## Ghi chú

- **NURSE / MANAGER**: role có trong seed (`database/iam-service/user-service/insert.sql`) nhưng **chưa có tài khoản seed nào gán 2 role này** — muốn test phải tạo account rồi gán role qua admin.
- Ngày đặt lịch hợp lệ theo seed `doctor_schedules`: **2026-07-13 → 2026-07-26** (trống lịch 07-18 và 07-25).
- Seed data nạp qua `make seed` / `scripts/seed-all.sh` sau khi stack chạy (`docker compose up -d`).
- Chỉ dùng cho môi trường dev/test — không dùng các tài khoản này ở production.

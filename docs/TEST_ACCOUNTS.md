# Test Accounts

Tài khoản seed để login test. **Nguồn sự thật: bảng `accounts` trong `auth_service_db` đang chạy** — danh sách dưới đây được truy vấn trực tiếp từ database (2026-08-01), không phải chép từ file.

**Mật khẩu chung cho mọi tài khoản: `Password123!`**

- Login UI: `http://localhost:3000/login`
- Login API: `POST http://localhost:8080/api/v1/auth/email/login` — body `{ "email": "...", "password": "Password123!" }`

Tổng cộng **61 tài khoản**, tất cả `status = ACTIVE`.

## ADMIN (1)

| Email | Ghi chú |
|---|---|
| `admin@smile.com` | ✅ đã đăng nhập kiểm chứng trên UI |

## DOCTOR (8)

| Email |
|---|
| `doctor1@smile.com` ✅ đã đăng nhập kiểm chứng trên UI (= Amelia Nguyen) |
| `doctor2@smile.com` … `doctor8@smile.com` |

## MANAGER (2)

| Email |
|---|
| `manager1@smile.com`, `manager2@smile.com` |

## NURSE (5)

| Email |
|---|
| `nurse1@smile.com` … `nurse5@smile.com` |

## RECEPTIONIST (4)

| Email |
|---|
| `receptionist1@smile.com` … `receptionist4@smile.com` |

## PATIENT (41)

Seed tạo 40 tài khoản dạng `patient1@smile.com` → `patient40@smile.com`. (Tài khoản thứ 41 là account `qa+...@example.com` đăng ký tay lúc test, không phải seed.)

| Email | Ghi chú |
|---|---|
| `patient10@smile.com` | ✅ đã đăng nhập kiểm chứng trên UI (= Zoe Truong) |
| `patient1@smile.com` … `patient40@smile.com` | |

## Bộ demo khuyên dùng (khớp `docs/guide.md`)

| Email | Role |
|---|---|
| `admin@smile.com` | ADMIN |
| `doctor1@smile.com` | DOCTOR |
| `patient10@smile.com` | PATIENT |

## Seed database

Đường **duy nhất** có script là TypeORM. Chạy theo thứ tự:

```bash
cd backend/service/iam-service
bun run migration:run && bun run migration:run:user
bun run seed:run:relational && bun run seed:run:user

cd backend/service/clinical-emr-service
bun run migration:run && bun run migration:run:clinic
bun run seed:run:relational && bun run seed:run:clinic

cd backend/service/payment-service
bun run migration:run && bun run seed:run
```

## Ghi chú

- ⚠️ **`database/**/insert.sql` và `database/**/schema.sql` chỉ là bản export tại một thời điểm — KHÔNG được nối vào bất kỳ script khởi tạo nào.** Không có `make seed` / `scripts/seed-all.sh` nào nạp chúng. Dùng đường TypeORM ở trên.
- ⚠️ Các email trong tài liệu cũ — `dr.nguyenvana@smile.com`, `nguyenvana.pt@email.com`, `recep.levan@smile.com`, `nurse.dothih@smile.com` — **KHÔNG tồn tại** trong database seed bằng TypeORM (đã kiểm tra: truy vấn trả về 0 dòng). Đăng nhập bằng chúng sẽ luôn thất bại.
- **NURSE / MANAGER đã có tài khoản seed thật** (5 và 2) — khác với ghi chú trong bản tài liệu cũ nói rằng chưa có.
- Ngày đặt lịch hợp lệ (database hiện tại): **2026-07-15 → 2026-10-27** theo `doctor_schedules` (Chủ nhật không có lịch). Mốc sinh lịch nay **tính theo ngày chạy seed** (−14 ngày / +90 ngày), nên **lần seed lại kế tiếp sẽ dịch cửa sổ này**; con số trên là của lần seed gần nhất, không phải hằng số.
- Chỉ dùng cho môi trường dev/test — không dùng các tài khoản này ở production.

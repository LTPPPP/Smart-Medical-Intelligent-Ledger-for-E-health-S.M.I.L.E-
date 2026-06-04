# Auth Service

Authentication Service for S.M.I.L.E - Built with NestJS and PostgreSQL

## Features

- Email/Password Authentication
- OAuth Integration (Google, Facebook, Apple)
- JWT Access & Refresh Tokens
- OTP Verification
- Account Lock/Unlock
- Failed Login Attempts Tracking
- Email Verification
- Password Reset

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/email/login` | Email/password login |
| POST | `/auth/email/register` | Register new account |
| POST | `/auth/email/confirm` | Confirm email |
| POST | `/auth/forgot/password` | Request password reset |
| POST | `/auth/reset/password` | Reset password with hash |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| PATCH | `/auth/me` | Update profile |
| DELETE | `/auth/me` | Delete account |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/google` | Google OAuth login |
| POST | `/auth/facebook` | Facebook OAuth login |
| POST | `/auth/apple` | Apple OAuth login |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts` | Create account (admin) |
| GET | `/accounts/:id` | Get account by ID |
| PATCH | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account |

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env-example .env
```

3. Run with Docker:
```bash
docker-compose up -d
```

4. Run migrations:
```bash
npm run migration:run
```

5. Run seeds:
```bash
npm run seed:run:relational
```

## Default Accounts

| Email | Password |
|-------|----------|
| admin@smile.com | Password123! |
| doctor1@smile.com | Password123! |
| doctor2@smile.com | Password123! |
| receptionist1@smile.com | Password123! |
| patient1@smile.com | Password123! |
| patient2@smile.com | Password123! |

## Swagger Documentation

Once running, visit `http://localhost:3000/docs` for API documentation.

## Environment Variables

See `.env-example` for all available configuration options.

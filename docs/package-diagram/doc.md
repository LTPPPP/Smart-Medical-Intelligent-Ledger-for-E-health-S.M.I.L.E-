**Keywords:** `Markdown Conversion`, `Structured Table`, `S.M.I.L.E Architecture`, `Package Registry`.

---

Here is the cleaned and formatted Markdown table representing your project's code packages:

| No | Package | Description |
| --- | --- | --- |
| **01** | **Front-end** | Containing the user interface built with Next.js 15 App Router and React 19, including all pages, shared components, API client, and state management. |
| **02** | **Features** | Feature-based modules organized by domain: auth, admin, clinic, examination, and landing — each containing page components and feature-specific logic. |
| **03** | **Shared** | Reusable components, hooks, API client (Axios/fetch), Zustand stores, utility functions, TypeScript types, and constants used across all features. |
| **04** | **SMILE Back-end** | Containing all three NestJS microservices that handle business logic, data access, and API responses for the S.M.I.L.E platform. |
| **05** | **Gateway Service** | API Gateway acting as the single entry point for all frontend requests, routing them to the appropriate downstream microservice via reverse proxy. |
| **06** | **Proxy** | Reverse proxy module that forwards incoming HTTP requests to IAM Service or Clinical EMR Service based on URL path matching. |
| **07** | **Common** | Shared cross-cutting concerns containing exception filters for centralized error handling and interceptors for request/response transformation and logging. |
| **08** | **Filter** | Global exception filters that catch and format all unhandled errors into a consistent API error response structure. |
| **09** | **Interceptors** | Request/response interceptors for logging, response transformation, and performance monitoring across all proxied requests. |
| **10** | **Config** | Environment configuration module managing gateway-specific settings such as upstream service URLs, ports, CORS, and rate-limiting rules. |
| **11** | **Health** | Health check endpoint /health used by Docker and monitoring tools to verify the gateway service is running and all upstream services are reachable. |
| **12** | **Swagger** | OpenAPI/Swagger documentation module that aggregates and serves the combined API documentation from all downstream microservices. |
| **13** | **IAM Service** | Identity and Access Management microservice handling authentication, authorization, account management, OAuth2 social login, RBAC, and user profile management. |
| **14** | **Accounts Services** | Managing user account CRUD operations including account creation, email/phone lookup, password hashing, login tracking, and account locking/unlocking. |
| **15** | **Audit-Logs Services** | Recording and querying audit trail entries for security-sensitive operations such as login attempts, password changes, and role assignments. |
| **16** | **Auth Services** | Core authentication logic including email/password login, registration, forgot/reset password, email confirmation, password change, and JWT token generation. |
| **17** | **Database Services** | TypeORM database connection and configuration module for IAM Service, managing PostgreSQL connection pooling, migrations, and entity registration. |
| **18** | **Mail Services** | Email delivery module using Nodemailer with Handlebars templates for sending transactional emails such as registration confirmation, password reset, and OTP codes. |
| **19** | **Notification Services** | Managing notification delivery across multiple channels email, push using templates, with support for scheduled and event-driven notifications. |
| **20** | **OAuth-Connection Services** | Managing OAuth2 social login connections Google, Facebook, Apple, linking/unlinking external provider accounts to internal user accounts. |
| **21** | **OTP-Tokens Services** | Generating, validating, and expiring one-time password tokens for multi-factor authentication and identity verification workflows. |
| **22** | **Permissions Services** | Managing granular permission definitions and CRUD operations for the permission registry used by the RBAC system. |
| **23** | **Refresh-Tokens Services** | Managing JWT refresh token lifecycle including creation, rotation, revocation, and cleanup of expired tokens for secure session management. |
| **24** | **Roles Services** | Managing role definitions Admin, Doctor, Patient, Receptionist and their associated permission sets for Role-Based Access Control. |
| **25** | **Social Services** | Handling social login data extraction and normalization from third-party OAuth providers into a unified internal user format. |
| **26** | **User-Roles Services** | Managing the assignment and revocation of roles to user accounts, supporting multi-role assignment and role-based access enforcement. |
| **27** | **Users Services** | Managing user profile CRUD operations including personal information, avatar, contact details, and profile preferences. |
| **28** | **Clinical EMR Service** | Electronic Medical Records microservice handling all clinical operations: appointments, patient records, examinations, prescriptions, dental imaging, and reporting. |
| **29** | **Appointments Services** | Managing the full appointment lifecycle: booking by specialty, by doctor, outside hours, confirmation, cancellation, rescheduling, and status history tracking. |
| **30** | **Clinical-Orders Services** | Managing clinical order workflows for laboratory tests, X-ray/CBCT imaging, and other diagnostic service requests linked to treatment plans. |
| **31** | **Clinics Services** | Managing clinic/facility information including clinic profiles, operating hours, contact details, and clinic-level configuration. |
| **32** | **Dental-Charts Services** | Managing dental chart data structures for recording tooth-level clinical findings, conditions, and treatment status per patient. |
| **33** | **Dental-Images Services** | Managing dental image metadata, upload/download via AWS S3 presigned URLs, categorization endodontic, X-ray, CBCT, and linking images to treatment profiles. |
| **34** | **Diagnoses Services** | Managing diagnosis records linked to examination sessions, including ICD codes, clinical findings, and diagnosis notes. |
| **35** | **Diagnoses-Orders Services** | Managing the association between diagnoses and clinical orders, tracking which diagnostic tests are ordered for specific diagnoses. |
| **36** | **Doctor-Leaves Services** | Managing doctor leave/absence records including leave type, date ranges, and approval status for schedule planning. |
| **37** | **Doctor-Schedules Services** | Managing doctor work schedules including clinic assignment, shift allocation, room assignment, maximum patient capacity, and schedule change auditing. |
| **38** | **Doctor-Specialties Services** | Managing the association between doctors and their dental/medical specialties for specialty-based appointment routing. |
| **39** | **Examination-Sessions Services** | Managing examination session records that group all clinical activities symptoms, diagnoses, orders, treatment plans within a single patient visit. |
| **40** | **Files Services** | Handling file upload/download operations via AWS S3, managing presigned URL generation, file metadata, and storage lifecycle. |
| **41** | **Gateway Services** | Internal HTTP client module for communicating with the IAM Service from Clinical EMR Service e.g., resolving user profiles, verifying KYC eligibility. |
| **42** | **Image-Annotations Services** | Managing annotations markings, labels, measurements overlaid on dental images by dentists during examination and treatment planning. |
| **43** | **Image-Categories Services** | Managing the categorization taxonomy for dental images e.g., endodontic, periapical, panoramic, CBCT used for filtering and organization. |
| **44** | **Lab-Test-Results Services** | Managing laboratory test result records including test type, result values, reference ranges, and status pending, completed. |
| **45** | **Medical-History Services** | Managing patient medical history entries including allergies, chronic conditions, previous surgeries, medications, and family medical history. |
| **46** | **Medical-Records Services** | Managing comprehensive patient medical records that aggregate examination sessions, diagnoses, treatment plans, and prescriptions. |
| **47** | **Pacs-Sync-Logs Services** | Tracking synchronization logs between the S.M.I.L.E system and external PACS Picture Archiving and Communication System for DICOM image exchange. |
| **48** | **Patients Services** | Managing patient demographic profiles including personal information, contact details, insurance data, and patient code generation. |
| **49** | **Prescriptions Services** | Managing electronic prescriptions linked to examination sessions, including prescription metadata, status, and physician signature. |
| **50** | **Prescription-Items Services** | Managing individual medication items within a prescription including drug name, dosage, frequency, quantity, and administration instructions. |
| **51** | **Record-Exports Services** | Generating and managing exports of patient medical records in standardized formats PDF, CSV for sharing with patients or other healthcare providers. |
| **52** | **Services Services** | Managing the catalog of dental/medical services offered by the clinic e.g., teeth cleaning, root canal, implant pricing and duration. |
| **53** | **Specialties Services** | Managing dental/medical specialty definitions e.g., Orthodontics, Endodontics, Periodontics used for doctor categorization and appointment routing. |
| **54** | **Symptoms Services** | Managing symptom records entered during examination sessions including symptom name, severity, location, and description. |
| **55** | **Treatment_History Services** | Tracking the history of treatments performed on patients including treatment dates, procedures, outcomes, and follow-up requirements. |
| **56** | **Treatment_Plans Services** | Managing treatment plans created by dentists, including planned procedures, estimated costs, timelines, and approval status. |
| **57** | **Treatment_Rooms Services** | Managing treatment room inventory including room number, equipment details, capacity, and availability status per clinic. |
| **58** | **Work-Shifts Services** | Managing work shift definitions morning, afternoon, evening with start/end times used for doctor schedule assignment. |
| **59** | **Controllers** | Handling incoming HTTP requests in each NestJS module, validating input using DTOs with class-validator, and returning formatted responses. |
| **60** | **Services** | Implementing the business logic layer in each NestJS module, orchestrating entity operations, validation rules, and cross-module communication. |
| **61** | **DTOs** | Containing Data Transfer Objects used to validate and shape request/response data between the API layer and business logic using class-validator and class-transformer. |
| **62** | **Entities** | Defining TypeORM entity classes that map directly to PostgreSQL tables, encapsulating data access operations find, save, update, delete via the repository pattern. |
| **63** | **Config** | Managing environment-specific configuration database URLs, JWT secrets, S3 credentials, mail settings loaded via @nestjs/config with Joi validation. |
| **64** | **Database** | TypeORM database connection modules managing PostgreSQL connections, connection pooling, migrations, and entity auto-discovery for each microservice. |
| **65** | **PostgreSQL** | Primary relational database system storing all application data across four logical databases: auth_service_db, account_service_db, core_medical_service_db, core_clinic_service_db. |
| **66** | **Redis** | In-memory data store used for high-speed caching of frequently accessed data and temporary session/token storage. |
| **67** | **AWS S3** | Cloud object storage service used for storing dental images, X-ray/CBCT files, and exported medical records via presigned URLs. |

---

### Suggested Next Steps / Topics to Explore

* **Monorepo Strategy:** Discussing how to structure these 67 packages cleanly using tools like **Turborepo** or **Nx** to optimize build times and shared dependencies (`Common`, `Shared`, `DTOs`).
* **Microservices Communication:** Mapping out how `Gateway Service` synchronously (via HTTP proxy) orchestrates flows with `IAM Service` and `Clinical EMR Service`.
# AI & Analytics Service (ai-service)

## 1. Introduction
The AI & Analytics Service is an intelligence layer augmenting the S.M.I.L.E platform. It features an NLP-driven chatbot for automated patient interactions (scheduling, health inquiries) and a robust data analytics engine that aggregates multi-dimensional health and business metrics into dashboards.

## 2. Structure and Database Design
Core Database: `ai_service_db`
- **chatbot_sessions, chatbot_messages**: Records conversational flows, tracking user intent and resolving outcomes (e.g., whether the chat resulted in a booked appointment).
- **ai_intent_logs, ai_suggestions**: Logs NLP model extraction confidence, entities (like "Toothache", "Tomorrow at 9AM"), and tracks the conversion rate of AI suggestions.
- **analytics_snapshots**: Optimized, pre-aggregated OLAP-style table storing dimensions (Clinic, Specialty, Doctor) and metrics (Revenue, Utilization, Satisfaction) for fast dashboard rendering.
- **report_templates, generated_reports**: Handles scheduled background jobs for generating PDF/Excel reports to clinic administrators.

## 3. Modules
- **chatbot**: Manages the Webhook integrating with external dialogue platforms (e.g., Dialogflow, Rasa, or proprietary LLMs) and maintains conversation state.
- **analytics**: Aggregates data from `core_clinic_service_db` and `payment_service_db` via asynchronous events or ETL processes to generate `analytics_snapshots`.
- **reporting**: Contains CRON job definitions and PDF generation libraries to export analytics into accessible documents.

## 4. Workflows

### 4.1. AI Chatbot Appointment Booking

```mermaid
sequenceDiagram
    participant Patient
    participant ChatAPI as AI Service (Chatbot)
    participant NLP as External NLP/LLM Model
    participant ClinicAPI as Core Clinic Service

    Patient->>ChatAPI: Web Chat: "I have a toothache, need a doctor tomorrow"
    ChatAPI->>ChatAPI: Create/Resume chatbot_sessions
    
    ChatAPI->>NLP: Analyze Text Intent
    NLP-->>ChatAPI: Intent: "book_appointment", Entities: [Symptom: toothache, Time: tomorrow]
    
    ChatAPI->>ChatAPI: Log to ai_intent_logs
    
    ChatAPI->>ClinicAPI: Query available dentists for tomorrow
    ClinicAPI-->>ChatAPI: Return available slots
    
    ChatAPI->>ChatAPI: Save to ai_suggestions
    ChatAPI-->>Patient: "I found Dr. Smith available tomorrow at 10 AM. Would you like to book?"
    
    Patient->>ChatAPI: "Yes, please."
    ChatAPI->>ClinicAPI: POST /appointments (Internal Auth)
    ClinicAPI-->>ChatAPI: Appointment Created
    
    ChatAPI->>ChatAPI: Update Session Outcome -> 'appointment_booked'
    ChatAPI-->>Patient: "Your appointment is confirmed!"
```

### 4.2. Nightly Analytics Aggregation

```mermaid
sequenceDiagram
    participant Cron as Cron Scheduler
    participant AnalyticsAPI as AI Service (Analytics)
    participant ClinicDB as Clinic Database
    participant PaymentDB as Payment Database
    participant AIDB as AI Database (analytics_snapshots)

    Cron->>AnalyticsAPI: Trigger Daily ETL (e.g., 01:00 AM)
    AnalyticsAPI->>ClinicDB: Read total completed appointments yesterday
    AnalyticsAPI->>PaymentDB: Read total revenue yesterday
    
    AnalyticsAPI->>AnalyticsAPI: Aggregate & Transform Data (per clinic, per doctor)
    
    AnalyticsAPI->>AIDB: Insert into analytics_snapshots
    
    AnalyticsAPI->>AnalyticsAPI: Check scheduled report_templates
    alt Reports Needed
        AnalyticsAPI->>AnalyticsAPI: Generate PDF Report
        AnalyticsAPI->>AIDB: Save to generated_reports
    end
```

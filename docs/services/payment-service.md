# Payment Service (payment-service)

## 1. Introduction
The Payment Service manages the comprehensive financial billing and payment procedures for S.M.I.L.E. From an initial appointment deposit to post-examination clinical and pharmacy billing. This service exposes integrated webhooks for popular Vietnamese payment gateways such as Momo and VNPay.

## 2. Structure and Database Design
Core Database: `payment_service_db`
- **payment_methods**: Defines accepted methods (CASH, MOMO, VNPAY, CREDIT_CARD).
- **payments, payment_items**: Manages the medical shopping cart. A cart can contain multiple line items (consultation fee, medications, lab tests). An `idempotency_key` is strictly enforced to prevent double-charging the patient.
- **invoices**: The finalized, formal billing record containing tax (VAT) calculations.
- **payment_transactions**: Detailed historical logging of gateway outbound requests, and inbound webhook callbacks (Success/Fail/Signature Invalid).
- **refunds**: Manages reconciliation and fund returns for patients who cancel services.

## 3. Modules
The source code is functionally centralized around financial operations:
- **payments**: A massive module governing CRUD operations for invoices and generating payment links.
  - Integrates IPN/Webhook validation (verifying HMAC signatures from VNPay/Momo to thwart spoofed requests).
  - Encapsulates SDK logic for each payment gateway (handling secrets, partner codes, environment configs).
- **home / utils / config**: Global configurations, currency formatting helpers (VND/USD string manipulation), and retry mechanisms for network-choked gateway calls.

## 4. Workflows

### 4.1. Online Payment via Momo/VNPay

```mermaid
sequenceDiagram
    participant Receptionist
    participant ClientApp
    participant PayAPI as Payment Service
    participant Gateway as External Gateway (Momo/VNPay)
    participant Broker as Message Broker

    Receptionist->>PayAPI: Generate Bill for Appointment #123
    PayAPI->>PayAPI: Create records in payments (Pending) and payment_items
    PayAPI-->>ClientApp: Return Bill Summary & Payment Types
    
    ClientApp->>PayAPI: Select MOMO Payment
    PayAPI->>PayAPI: Generate Hash Signature & construct payload
    PayAPI->>Gateway: POST /create_payment_link
    Gateway-->>PayAPI: Return redirect_url
    PayAPI-->>ClientApp: Send redirect_url
    
    ClientApp->>Gateway: User navigates & completes payment on Momo
    
    Gateway->>PayAPI: Webhook (IPN Callback) with Status & Signature
    PayAPI->>PayAPI: Validate HMAC Signature
    alt Invalid Signature
        PayAPI-->>Gateway: 400 Bad Request (Log to payment_transactions)
    else Valid Signature & Success Status
        PayAPI->>PayAPI: Update payments (Status: Completed)
        PayAPI->>PayAPI: Generate Invoice (pdf)
        PayAPI->>Broker: Publish "Payment Completed" Event
        PayAPI-->>Gateway: 200 OK (Acknowledge)
        Broker->>ClientApp: Notify App/Receptionist Dashboard
    end
```

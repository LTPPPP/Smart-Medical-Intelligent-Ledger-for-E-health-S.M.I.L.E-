# S.M.I.L.E Security Analysis

## Threat Model, Cryptography, Attack Vectors, and Regulatory Compliance

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Cryptography Specifications](#2-cryptography-specifications)
3. [Attack Vectors and Mitigations](#3-attack-vectors-and-mitigations)
4. [Key Management](#4-key-management)
5. [Identity and Access Management](#5-identity-and-access-management)
6. [Regulatory Compliance Analysis](#6-regulatory-compliance-analysis)
7. [Privacy by Design](#7-privacy-by-design)
8. [Audit and Monitoring](#8-audit-and-monitoring)

---

## 1. Threat Model

### 1.1 Asset Classification

| Asset | Classification | Value | Threat Level |
|-------|---------------|-------|--------------|
| Medical Records | PHI/PII | Critical | High |
| Patient Consent Records | PHI/PII | Critical | High |
| Encryption Keys | Secret | Critical | Critical |
| AI Diagnostic Results | Medical Data | High | Medium |
| Access Audit Logs | Compliance | High | Medium |
| Network Certificates | Identity | High | High |
| IPFS Stored Images | Medical Data | Medium | Medium |

### 1.2 Threat Actor Categories

```mermaid
graph TB
    subgraph "Threat Actors"
        Outsider[Outside Attacker<br/>- Hackers<br/>- Nation States] -->|Internet| Network
        
        Insider[Malicious Insider<br/>- Disgruntled Employee<br/>- Compromised Admin] -->|Internal Network| Services
        
        Partner[Partner/Clinic<br/>- Compromised Org<br/>- Data Broker] -->|External API| Gateway
        
        User[End User<br/>- Malicious Patient<br/>- Accidental Leak] -->|Public Internet| WebApp
    end
    
    subgraph "S.M.I.L.E Assets"
        Network[Network Infrastructure]
        Services[Application Services]
        WebApp[Web/Mobile App]
        Data[Database + Blockchain]
    end
    
    Outsider --> Data
    Insider --> Data
    Partner --> Services
    User --> WebApp
```

### 1.3 Attack Surface

| Component | Attack Surface | Entry Points |
|-----------|---------------|--------------|
| API Gateway | Public | REST API endpoints |
| Auth Service | Public | Login, OAuth, OTP |
| Medical Service | Internal | GRPC from gateway |
| Blockchain Service | Internal | Fabric Gateway SDK |
| Peer Nodes | Internal | Gossip protocol |
| Orderer Nodes | Internal | Raft consensus |
| CouchDB | Internal | HTTP API |
| IPFS | Internal/External | IPFS API |
| HashiCorp Vault | Internal | Vault API |

---

## 2. Cryptography Specifications

### 2.1 Hash Functions

| Use Case | Algorithm | Output | Standard |
|----------|-----------|--------|----------|
| Data Integrity | SHA-256 | 256 bits (32 bytes) | FIPS 180-4 |
| Consent Proof | SHA-256 | 256 bits | FIPS 180-4 |
| Audit Verification | SHA-256 | 256 bits | FIPS 180-4 |
| Deletion Proof | SHA-256 | 256 bits | FIPS 180-4 |
| Key Metadata | SHA-256 | 256 bits | FIPS 180-4 |

### 2.2 Symmetric Encryption

| Use Case | Algorithm | Key Size | Mode | Standard |
|----------|-----------|----------|------|----------|
| Data at Rest (PostgreSQL) | AES-256-GCM | 256 bits | GCM | NIST SP 800-175B |
| Data at Rest (Vault) | AES-256-GCM | 256 bits | GCM | NIST SP 800-175B |
| TLS Data | AES-256-GCM | 256 bits | GCM | TLS 1.3 |

### 2.3 Asymmetric Encryption

| Use Case | Algorithm | Key Size | Standard |
|----------|-----------|----------|---------|
| Key Wrapping | RSA-OAEP | 4096 bits | PKCS#1 v2.2 |
| Digital Signatures | ECDSA | P-256 | FIPS 186-4 |
| TLS Key Exchange | ECDH | P-256 | TLS 1.3 |

### 2.4 TLS Configuration

| Component | TLS Version | Cipher Suites | Certificate |
|-----------|-------------|---------------|-------------|
| Client → Gateway | 1.3 | TLS_AES_256_GCM_SHA384 | Let's Encrypt |
| Gateway → Services | 1.3 | TLS_AES_256_GCM_SHA384 | Internal CA |
| Service ↔ Fabric | 1.3 | TLS_AES_256_GCM_SHA384 | Fabric CA |
| CouchDB | 1.2 | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 | Fabric CA |
| IPFS | 1.2 | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 | Self-signed |
| Vault | 1.2 | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 | Vault PKI |

---

## 3. Attack Vectors and Mitigations

### 3.1 Insider Threat

**Scenario**: A database administrator with privileged access attempts to modify medical records.

**S.M.I.L.E Mitigation**:

```mermaid
sequenceDiagram
    participant Admin as DB Admin
    participant PG as PostgreSQL
    participant Fabric
    participant BC as Blockchain Service
    
    Admin->>PG: Modify examination record
    PG-->>Admin: Success (record modified)
    
    Note over Admin: But blockchain has proof!
    
    Admin->>Fabric: Query anchor
    Fabric-->>Admin: Original hash
    
    Admin->>BC: Verify(record)
    BC-->>Admin: ❌ TAMPER DETECTED<br/>Original: a1b2c3<br/>Current: x9y8z7
```

| Mitigation | Implementation |
|------------|---------------|
| Immutable anchors | SHA-256 hashes stored on Fabric ledger |
| Verification | On-demand hash verification via blockchain-service |
| Separation of duties | No single admin can modify both DB and blockchain |
| Audit trail | access-control-cc logs all data modifications |

---

### 3.2 Data Tampering

**Scenario**: An attacker gains access to PostgreSQL and modifies patient examination data.

**Mitigations**:

| Layer | Protection |
|-------|------------|
| Network | Firewall, network segmentation |
| Application | RBAC, input validation |
| Database | Row-level security, audit logging |
| Blockchain | Hash anchoring + verification |
| Verification | Automated integrity checks |

---

### 3.3 Unauthorized Access (Consent Bypass)

**Scenario**: A clinic attempts to access patient records without valid consent.

**Mitigation Flow**:

```mermaid
sequenceDiagram
    participant Clinic as Clinic B
    participant API as Blockchain Service
    participant ConsentCC as consent-cc
    participant Ledger

    Clinic->>API: Request patient records
    API->>ConsentCC: GetConsentsByPatient(patientID, clinicID)
    
    alt Consent Exists and Active
        ConsentCC-->>API: ConsentRecord{is_active: true}
        API-->>Clinic: ✅ Return records
    else Consent Not Found
        ConsentCC-->>API: No consent found
        API-->>Clinic: ❌ 403 Forbidden
    else Consent Withdrawn
        ConsentCC-->>API: ConsentRecord{is_active: false}
        API-->>Clinic: ❌ 403 Forbidden
    end
```

---

### 3.4 Key Compromise

**Scenario**: Encryption keys stored in Vault are compromised.

**Mitigations**:

| Protection | Implementation |
|------------|---------------|
| Key separation | Actual keys never on-chain, only metadata |
| Key rotation | key-mgmt-cc rotation with version tracking |
| Hardware security | HSM support in Vault (production) |
| Access logging | RecordKeyAccess in key-mgmt-cc |
| Automatic deactivation | Compromised keys can be instantly deactivated |

---

### 3.5 Sybil Attack

**Scenario**: An attacker creates multiple identities to gain majority control.

**Mitigations**:

| Protection | Implementation |
|------------|---------------|
| Permissioned network | All identities verified by Fabric CA |
| MSP | Membership Service Provider enforces identity |
| PKI | X.509 certificates required |
| Endorsement | MAJORITY policy requires multiple orgs |

---

### 3.6 Replay Attack

**Scenario**: An attacker captures and replays a valid transaction.

**Mitigations**:

| Protection | Implementation |
|------------|---------------|
| Nonces | Client generates unique nonce per transaction |
| Transaction ID | Fabric tx_id includes nonce + timestamp |
| Channel isolation | Separate channels prevent cross-channel replay |

---

### 3.7 Network Eavesdropping

**Scenario**: An attacker intercepts network traffic.

**Mitigations**:

| Protection | Implementation |
|------------|---------------|
| TLS 1.3 | All external traffic encrypted |
| mTLS | Service-to-service authentication |
| VPN | Private network for Fabric components |

---

## 4. Key Management

### 4.1 Architecture Overview

```mermaid
graph TB
    subgraph "S.M.I.L.E"
        BC[Blockchain Service] --> Vault[HashiCorp Vault]
        BC --> Fabric[Hyperledger Fabric]
    end
    
    subgraph "HashiCorp Vault"
        Transit[Transit Engine<br/>AES-256-GCM, RSA-4096]
        KV[KV Engine<br/>Key metadata]
        PKI[PKI Engine<br/>Certificates]
    end
    
    subgraph "On-Chain"
        KeyMgmtCC[key-mgmt-cc<br/>Metadata only]
    end
    
    Vault -->|"Encrypt/Decrypt"| Transit
    Vault -->|"Store metadata"| KV
    Vault -->|"Issue certs"| PKI
    
    BC -->|"Register metadata"| KeyMgmtCC
    KeyMgmtCC --> Fabric
```

### 4.2 Key Types

| Key Type | Algorithm | Storage | Rotation |
|----------|-----------|---------|----------|
| Data Encryption | AES-256-GCM | Vault Transit | 90 days |
| Key Wrapping | RSA-4096 | Vault Transit | 1 year |
| TLS Server | ECDSA P-256 | Vault PKI | 90 days |
| TLS Client | ECDSA P-256 | Vault PKI | 90 days |
| Fabric Signing | ECDSA P-256 | Fabric MSP | 1 year |

### 4.3 Key Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PreActive
    
    PreActive --> Active : Generated
    
    Active --> Rotating : Rotation triggered
    Rotating --> Active : New key version
    
    Active --> Compromised : Security event
    Compromised --> Deactivated : Emergency rotation
    
    Active --> Expired : Time-based expiry
    Expired --> Deactivated
    
    Deactivated --> [*]
```

### 4.4 Vault Policies

```hcl
# Key usage policy
path "transit/encrypt/smile-*" {
  capabilities = ["update"]
}

path "transit/decrypt/smile-*" {
  capabilities = ["update"]
}

# Key metadata (read-only for audit)
path "kv/data/smile/keys/*" {
  capabilities = ["read"]
}
```

---

## 5. Identity and Access Management

### 5.1 Fabric MSP Structure

```mermaid
graph TB
    subgraph "Org1MSP"
        CA1[CA Org1<br/>ca_org1]
        Admin1[Admin<br/>Identity]
        Peer1[Peer<br/>Identity]
        User1[Users<br/>Identities]
    end
    
    subgraph "Org2MSP"
        CA2[CA Org2<br/>ca_org2]
        Admin2[Admin<br/>Identity]
        Peer2[Peer<br/>Identity]
        User2[Users<br/>Identities]
    end
    
    CA1 --> Admin1
    CA1 --> Peer1
    CA1 --> User1
    
    CA2 --> Admin2
    CA2 --> Peer2
    CA2 --> User2
```

### 5.2 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Patient | Read own records, grant/withdraw consent, request deletion |
| Doctor | Read patient records (with consent), create records, sign records |
| Admin | Manage users, configure system, view all audits |
| System | Anchor records, verify integrity (service account) |

### 5.3 Endorsement Policy

```yaml
# Example endorsement policy
version: 1
identities:
  user:
    role: member
  peer:
    role: peer
policy:
  1-of:
    - signed-by: user
    - 1-of:
        - signed-by: peer
```

For S.M.I.L.E:
```
AND('Org1MSP.peer', 'Org2MSP.peer')
→ Requires endorsement from BOTH organizations
```

---

## 6. Regulatory Compliance Analysis

### 6.1 HIPAA Compliance Mapping

| HIPAA Requirement | Section | S.M.I.L.E Implementation |
|-------------------|---------|--------------------------|
| Access Control | §164.312(a)(1) | RBAC + Fabric MSP |
| Audit Controls | §164.312(b) | access-control-cc |
| Integrity | §164.312(c)(1) | Hash anchoring + verification |
| Transmission Security | §164.312(e)(1) | TLS 1.3 |
| Person/entity authentication | §164.312(d) | X.509 + JWT |
| Minimum necessary | §164.502(b) | Consent-CC gates access |

### 6.2 GDPR Compliance Mapping

```mermaid
graph TB
    subgraph "GDPR Articles"
        Art4[Art. 4<br/>Definitions]
        Art6[Art. 6<br/>Lawful processing]
        Art7[Art. 7<br/>Consent]
        Art12[Art. 12-22<br/>Data Subject Rights]
        Art30[Art. 30<br/>Records]
        Art32[Art. 32<br/>Security]
        Art33[Art. 33<br/>Breach]
    end
    
    subgraph "S.M.I.L.E Components"
        ConsentCC[consent-cc<br/>Art. 7]
        DeletionCC[deletion-cc<br/>Art. 17]
        LineageCC[data-lineage-cc<br/>Art. 30]
        KeyMgmtCC[key-mgmt-cc<br/>Art. 32]
        AuditCC[access-control-cc<br/>Art. 30]
    end
    
    Art7 --> ConsentCC
    Art17 --> DeletionCC
    Art30 --> LineageCC
    Art30 --> AuditCC
    Art32 --> KeyMgmtCC
```

### 6.3 Decree 13/2023 Compliance (Vietnam)

| Decree Requirement | Article | S.M.I.L.E Implementation |
|-------------------|---------|-------------------------|
| Personal data protection principles | Art. 11 | Privacy by design |
| Consent requirement | Art. 13 | consent-cc |
| Data processing records | Art. 26 | data-lineage-cc |
| Encryption requirements | Art. 27 | AES-256-GCM, Vault |
| Key management | Art. 28 | key-mgmt-cc + Vault |
| Data deletion | Art. 30 | deletion-cc |

---

## 7. Privacy by Design

### 7.1 Data Minimization

| Principle | Implementation |
|-----------|---------------|
| Collect only necessary | Hash-only anchoring, no PHI on-chain |
| Purpose limitation | Consent-cc restricts use per purpose |
| Storage limitation | Deletion-cc implements right to erasure |

### 7.2 Privacy Architecture

```mermaid
graph LR
    subgraph "Patient Data"
        PHI[Full PHI<br/>PostgreSQL/IPFS]
    end
    
    subgraph "On-Chain (Public)"
        Hash[SHA-256 Hash<br/>32 bytes]
        Meta[Metadata<br/>Patient ID, timestamps]
    end
    
    PHI -->|"Hash function"| Hash
    PHI -->|"Reference"| Meta
    
    Hash -.->|"Cannot derive PHI"| Attacker[Attacker]
    Meta -.->|"Limited info"| Attacker
```

### 7.3 Consent-Gated Access

```mermaid
graph TB
    Request[Data Request] --> Check{Consent<br/>Exists?}
    Check -->|Yes| Active{Consent<br/>Active?}
    Check -->|No| Deny[403 Deny]
    Active -->|Yes| Grant[Grant Access]
    Active -->|No| Deny
    
    Grant --> Log[access-control-cc<br/>Log access]
    Deny --> Log
```

---

## 8. Audit and Monitoring

### 8.1 Blockchain Audit Trail

All Fabric transactions create immutable audit records:

```json
{
  "tx_id": "0xabc123...",
  "type": "ENDORSER_TRANSACTION",
  "channel_id": "medicalrecords",
  "timestamp": "2024-03-15T10:30:00Z",
  "creator": {
    "msp_id": "Org1MSP",
    "id": "doctor-uuid-789"
  },
  "actions": [
    {
      "chaincode_id": "medical-anchor-cc",
      "function": "AnchorMedicalData",
      "args": ["data-id", "examination", "hash...", ...]
    }
  ]
}
```

### 8.2 Security Monitoring

| Event | Source | Alert |
|-------|--------|-------|
| Failed login attempts | Auth Service | Threshold > 5/min |
| Consent withdrawal | consent-cc | Immediate |
| Key rotation | key-mgmt-cc | Immediate |
| Deletion request | deletion-cc | Immediate |
| Unauthorized access | access-control-cc | Immediate |
| Blockchain tx failure | Fabric | Immediate |

### 8.3 Compliance Reporting

The `compliance_reports` table tracks regulatory compliance:

```sql
SELECT * FROM compliance_reports 
WHERE report_type = 'hipaa_audit' 
AND period_start >= '2024-01-01' 
AND period_end <= '2024-03-31';
```

---

## Summary: Security Controls Matrix

| Threat | Control | Implementation |
|---------|---------|---------------|
| Data tampering | Hash anchoring | SHA-256 on Fabric |
| Unauthorized access | Consent gating | consent-cc |
| Key compromise | Vault + rotation | key-mgmt-cc |
| Insider threat | Separation + audit | access-control-cc |
| Regulatory non-compliance | Chaincodes | 7 purpose-built contracts |
| Network attack | TLS/mTLS | TLS 1.3 |
| Identity spoofing | Fabric CA + MSP | X.509 certificates |

---

*Document Version: 1.0*  
*Last Updated: March 2026*  
*S.M.I.L.E - Smart Medical Intelligent Ledger for E-health*

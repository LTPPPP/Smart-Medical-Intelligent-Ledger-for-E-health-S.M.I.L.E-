# S.M.I.L.E Blockchain System Architecture

## Technical Deep-Dive into the Hyperledger Fabric Infrastructure

---

## Table of Contents

1. [Network Topology](#1-network-topology)
2. [Node Architecture](#2-node-architecture)
3. [Channel Architecture](#3-channel-architecture)
4. [Integration Layer](#4-integration-layer)
5. [Storage Architecture](#5-storage-architecture)
6. [Event Streaming](#6-event-streaming)
7. [High Availability](#7-high-availability)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Configuration](#9-deployment-configuration)

---

## 1. Network Topology

### 1.1 Fabric Network Overview

The S.M.I.L.E blockchain network is built on **Hyperledger Fabric v2.5** with a permissioned, Raft-based ordering service.

```mermaid
graph TB
    subgraph "S.M.I.L.E Hyperledger Fabric Network"
        subgraph "Orderer Organization"
            O1[orderer.example.com<br/>:7050]
            O2[orderer2.example.com<br/>:7150]
            O3[orderer3.example.com<br/>:7250]
        end

        subgraph "Organization 1 (Healthcare Providers)"
            Org1[Org1MSP]
            P1[peer0.org1.example.com<br/>:7051]
            G1[Global Scope<br/>CouchDB:5984]
            CA1[ca_org1<br/>:7054]
        end

        subgraph "Organization 2 (Research/Secondary)"
            Org2[Org2MSP]
            P2[peer0.org2.example.com<br/>:9051]
            G2[Global Scope<br/>CouchDB:7984]
            CA2[ca_org2<br/>:8054]
        end

        subgraph "CA Infrastructure"
            CAO[ca_orderer<br/>:9054]
        end

        O1 --- O2
        O2 --- O3
        
        P1 --- O1
        P2 --- O1
        P1 --- P2
        
        Org1 --- P1
        Org2 --- P2
        Org1 --- CA1
        Org2 --- CA2
        
        P1 --- G1
        P2 --- G2
    end

    subgraph "External Services"
        BC_Svc[Blockchain Service<br/>NestJS:3007]
    end

    BC_Svc --> P1
    BC_Svc --> P2
```

### 1.2 Node Specifications

| Node Type | Hostname | Ports | Organization | TLS |
|-----------|----------|-------|--------------|-----|
| Orderer | orderer.example.com | 7050 (grpc), 9443 (metrics) | OrdererMSP | Enabled |
| Orderer | orderer2.example.com | 7150, 9444 | OrdererMSP | Enabled |
| Orderer | orderer3.example.com | 7250, 9445 | OrdererMSP | Enabled |
| Peer | peer0.org1.example.com | 7051 (grpc), 7052 (events), 9446 (metrics) | Org1MSP | Enabled |
| Peer | peer0.org2.example.com | 9051 (grpc), 9052 (events), 9447 (metrics) | Org2MSP | Enabled |
| CA | ca_org1 | 7054 (http), 7055 (https) | Org1MSP | TLS optional |
| CA | ca_org2 | 8054, 8055 | Org2MSP | TLS optional |
| CA | ca_orderer | 9054, 9055 | OrdererMSP | TLS optional |

### 1.3 Network Connectivity Matrix

```mermaid
graph LR
    subgraph "Service Layer"
        BC[Blockchain Service<br/>:3007]
    end

    subgraph "Peer Connections"
        BC -->|"Gateway SDK"| P1
        BC -->|"Gateway SDK"| P2
    end

    subgraph "P2P Mesh"
        P1 <-->|"Gossip"| O1
        P1 <-->|"Gossip"| P2
        P2 <-->|"Gossip"| O1
        
        O1 <-->|"Raft"| O2
        O2 <-->|"Raft"| O3
    end

    subgraph "Storage"
        P1 -->|"State DB"| C1[CouchDB<br/>:5984]
        P2 -->|"State DB"| C2[CouchDB<br/>:7984]
    end

    subgraph "Certificate Authorities"
        P1 -->|"Register/Enroll"| CA1
        P2 -->|"Register/Enroll"| CA2
        O1 -->|"Register/Enroll"| CAO
    end
```

---

## 2. Node Architecture

### 2.1 Orderer Node Components

```mermaid
graph TB
    subgraph "Orderer Node"
        subgraph "API Layer"
            GRPC[GRPC Server<br/>:7050]
            Admin[Admin Server<br/>:9443]
        end

        subgraph "Core"
            Comm[Committed<br/>Chain Installer]
            Deliver[Deliver Server<br/>Block Streaming]
        end

        subgraph "Consensus Module"
            Raft[Raft Protocol<br/>Leader Election]
            Consenter[Consenter Set<br/>Management]
        end

        subgraph "Chain Support"
            BlockCutter[Block Cutter<br/>Batch Size/Timeout]
            Writer[Block Writer<br/>File System]
            Multichain[Multi-chain Support]
        end

        subgraph "Storage"
            Ledger[Orderer Ledger<br/>System Channel]
            WAL[Write-Ahead Log]
        end

        GRPC --> Comm
        Comm --> Deliver
        Deliver --> Raft
        Raft --> Consenter
        Consenter --> BlockCutter
        BlockCutter --> Writer
        Writer --> Ledger
        Multichain --> Ledger
    end
```

**Orderer Responsibilities**:
- Transaction ordering (Raft consensus)
- Block cutting (batch size: 500, absolute max: 1020)
- Block distribution to peers via Deliver service
- Channel management (create, join, update)
- System channel maintenance

### 2.2 Peer Node Components

```mermaid
graph TB
    subgraph "Peer Node"
        subgraph "API Layer"
            GRPC[GRPC Server<br/>:7051]
            Events[Event Hub<br/>:7052]
            Admin[Admin Server<br/>:9446]
        end

        subgraph "Endorsement"
            ES[Endorser<br/>Simulation]
            VSW[Validation<br/>System Chaincode]
        end

        subgraph "Gossip"
            Proto[Gossip Protocol<br/>State Propagation]
            Discovery[Peer Discovery]
            Anchor[Anchor Peer Update]
        end

        subgraph "Ledger"
            PeerLedger[Peer Ledger<br/>Block Store]
            StateDB[World State<br/>CouchDB]
            History[History DB]
        end

        subgraph "Chaincode"
            VM[Container VM<br/>Docker]
            Registry[Chaincode Registry]
            Lifecycle[Package/Install/Upgrade]
        end

        GRPC --> ES
        ES --> VSW
        ES --> Proto
        Proto --> Discovery
        
        VSW --> PeerLedger
        VSW --> StateDB
        
        VM --> Registry
        Registry --> Lifecycle
        
        Events --> PeerLedger
    end
```

**Peer Responsibilities**:
- Endorsement policy validation
- Transaction simulation
- Ledger maintenance (blocks + state)
- Chaincode execution (in Docker containers)
- Gossip-based state propagation
- Block event generation

### 2.3 Certificate Authority Architecture

```mermaid
graph TB
    subgraph "Fabric CA Infrastructure"
        subgraph "CA Org1"
            CA1[ca_org1<br/>:7054]
            DB1[(CA Database<br/>PostgreSQL)]
        end
        
        subgraph "CA Org2"
            CA2[ca_org2<br/>:8054]
            DB2[(CA Database<br/>PostgreSQL)]
        end
        
        subgraph "CA Orderer"
            CAO[ca_orderer<br/>:9054]
            DBO[(CA Database<br/>PostgreSQL)]
        end
    end

    CA1 --> DB1
    CA2 --> DB2
    CAO --> DBO
```

**CA Functions**:
- Identity registration
- Certificate issuance (ECerts for transactions, ICerts for TLS)
- Certificate revocation
- Attribute-based access control (future)

---

## 3. Channel Architecture

### 3.1 Channel Overview

S.M.I.L.E operates two Fabric channels for logical data separation:

```mermaid
graph TB
    subgraph "MedicalRecordsChannel"
        MC[Channel Name:<br/>medicalrecords]
        MC_Anchors[medical-anchor-cc<br/>Data lineage]
        MC_KeyMgmt[key-mgmt-cc]
    end

    subgraph "ConsentChannel"
        CC[Channel Name:<br/>consent]
        CC_Consent[consent-cc<br/>Access control]
        CC_Deletion[deletion-cc]
    end

    Org1 --> MC
    Org1 --> CC
    Org2 --> MC
    Org2 --> CC
```

### 3.2 Channel Configuration

| Property | MedicalRecordsChannel | ConsentChannel |
|----------|----------------------|----------------|
| **Channel Name** | `medicalrecords` | `consent` |
| **Block Validation** | | |
| - Validation | true | true |
| - Max Transaction Count | 500 | 500 |
| - Absolute Max Bytes | 10 MB | 10 MB |
| - Preferred Max Bytes | 2 MB | 2 MB |
| **Ordering Service** | | |
| - Type | raft | raft |
| - Consenters | 3 orderers | 3 orderers |
| **Organizations** | | |
| - Org1MSP | Member | Member |
| - Org2MSP | Member | Member |
| **Anchor Peers** | | |
| - Org1 | peer0.org1:7051 | peer0.org1:7051 |
| - Org2 | peer0.org2:9051 | peer0.org2:9051 |

### 3.3 Channel Creation Flow

```mermaid
sequenceDiagram
    participant Admin
    participant CLI as Fabric CLI
    participant O1 as Orderer 1
    participant O2 as Orderer 2
    participant O3 as Orderer 3
    participant P1 as Peer 0 Org1
    participant P2 as Peer 0 Org2

    Admin->>CLI: Create channel config (channel.tx)
    CLI->>O1: Create channel
    O1->>O2: Raft consensus
    O2->>O3: Raft consensus
    O3-->>CLI: Channel created
    
    CLI->>P1: Join channel
    P1-->>CLI: Joined
    
    CLI->>P2: Join channel
    P2-->>CLI: Joined
    
    CLI->>P1: Set anchor peers
    CLI->>P2: Set anchor peers
```

---

## 4. Integration Layer

### 4.1 Blockchain Service Architecture

The **Blockchain Service** (NestJS, port 3007) serves as the bridge between the S.M.I.L.E microservices and the Hyperledger Fabric network.

```mermaid
graph TB
    subgraph "Blockchain Service (NestJS)"
        subgraph "API Layer"
            Controller[REST Controllers<br/>/api/v1/blockchain/*]
            Swagger[Swagger/OpenAPI<br/>Documentation]
        end

        subgraph "Business Logic"
            Anchor[Anchor Service<br/>Hash computation]
            Consent[Consent Service<br/>Grant/Withdraw]
            Audit[Audit Service<br/>Access logging]
            Lineage[Lineage Service<br/>Provenance tracking]
            Deletion[Deletion Service<br/>Right to erasure]
            CrossChain[Cross-Chain Service<br/>Bridging]
            KeyMgmt[Key Service<br/>Vault integration]
        end

        subgraph "Fabric Integration"
            Gateway[Fabric Gateway SDK<br/>Connection]
            Registry[Fabric Contract Registry<br/>7 Chaincodes]
            Identity[Identity Service<br/>Wallet management]
        end

        subgraph "External Services"
            Vault[HashiCorp Vault<br/>AES-256-GCM, RSA-4096]
            IPFS[IPFS Kubo<br/>File storage]
            Kafka[Apache Kafka<br/>Events]
        end

        Controller --> Anchor
        Controller --> Consent
        Controller --> Audit
        Controller --> Lineage
        Controller --> Deletion
        Controller --> CrossChain
        Controller --> KeyMgmt

        Anchor --> Gateway
        Consent --> Gateway
        Audit --> Gateway
        Lineage --> Gateway
        Deletion --> Gateway
        CrossChain --> Gateway
        KeyMgmt --> Gateway

        Gateway --> Identity
        
        Anchor --> Vault
        KeyMgmt --> Vault
        
        Anchor --> IPFS
        CrossChain --> IPFS
        
        Anchor --> Kafka
        Consent --> Kafka
        Audit --> Kafka
    end
```

### 4.2 Fabric Gateway SDK Integration

```mermaid
graph LR
    subgraph "Application"
        BC_Svc[Blockchain Service]
        Wallet[Wallet<br/>X.509 Identities]
    end

    subgraph "Fabric Network"
        Gateway[Gateway<br/>peer0.org1:7051]
        
        subgraph "Endorsement Path"
            Gateway --> E1[Endorse<br/>Org1]
            Gateway --> E2[Endorse<br/>Org2]
        end
        
        subgraph "Ordering Path"
            E1 --> O[Orderer<br/>Raft]
            E2 --> O
        end
        
        subgraph "Commit Path"
            O --> C1[Commit<br/>Org1]
            O --> C2[Commit<br/>Org2]
        end
    end

    BC_Svc --> Wallet
    Wallet --> Gateway
```

### 4.3 API Endpoints Summary

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| **Anchors** | `/api/v1/blockchain/anchors` | POST | Anchor medical data hash |
| | `/api/v1/blockchain/anchors/:id` | GET | Get anchor by ID |
| | `/api/v1/blockchain/anchors/patient/:patientId` | GET | Get anchors by patient |
| | `/api/v1/blockchain/anchors/:id/verify` | POST | Verify data integrity |
| **Consents** | `/api/v1/blockchain/consents` | POST | Grant consent |
| | `/api/v1/blockchain/consents/:id` | GET | Get consent |
| | `/api/v1/blockchain/consents/patient/:patientId` | GET | Get patient's consents |
| | `/api/v1/blockchain/consents/:id/withdraw` | POST | Withdraw consent |
| **Audits** | `/api/v1/blockchain/audits` | POST | Record access audit |
| | `/api/v1/blockchain/audits/:id` | GET | Get audit record |
| | `/api/v1/blockchain/audits/user/:userId` | GET | Get audits by user |
| | `/api/v1/blockchain/audits/resource/:resourceType/:resourceId` | GET | Get audits by resource |
| **Lineage** | `/api/v1/blockchain/lineage` | POST | Record lineage |
| | `/api/v1/blockchain/lineage/:id` | GET | Get lineage |
| | `/api/v1/blockchain/lineage/data/:dataId` | GET | Get lineage by data |
| **Deletion** | `/api/v1/blockchain/deletion` | POST | Create deletion request |
| | `/api/v1/blockchain/deletion/:id` | GET | Get deletion request |
| | `/api/v1/blockchain/deletion/:id/complete` | POST | Complete deletion |
| **Key Mgmt** | `/api/v1/blockchain/keys` | POST | Register key metadata |
| | `/api/v1/blockchain/keys/:id` | GET | Get key metadata |
| | `/api/v1/blockchain/keys/:id/rotate` | POST | Rotate key |
| **Cross-Chain** | `/api/v1/blockchain/shares` | POST | Create share request |
| | `/api/v1/blockchain/shares/:id/approve` | POST | Approve share |
| | `/api/v1/blockchain/shares/:id/complete` | POST | Complete share |
| **Network** | `/api/v1/blockchain/network/health` | GET | Network health check |
| | `/api/v1/blockchain/network/channels` | GET | List channels |
| | `/api/v1/blockchain/network/peers` | GET | List peers |

---

## 5. Storage Architecture

### 5.1 Multi-Layer Storage Model

```mermaid
graph TB
    subgraph "On-Chain (Fabric Ledger)"
        BC[Blockchain<br/>Hashes + Metadata<br/>~KB/day]
    end

    subgraph "Off-Chain (Distributed)"
        CouchDB[State Database<br/>CouchDB 3.3<br/>Indexed JSON<br/>~MB/day]
    end

    subgraph "Object Storage"
        IPFS[IPFS Cluster<br/>DICOM Images<br/>Large Files<br/>~GB/day]
    end

    subgraph "Relational"
        PG[PostgreSQL<br/>Service Metadata<br/>Application Data<br/>~MB/day]
    end

    subgraph "Cache"
        Redis[Redis 7<br/>Session + Cache<br/>Hot Data]
    end

    Medical -->|"Anchors hash"| BC
    Medical -->|"Full records"| PG
    Medical -->|"State queries"| CouchDB
    Medical -->|"DICOM files"| IPFS
    Gateway -->|"Session"| Redis
```

### 5.2 CouchDB State Database

Each peer maintains a CouchDB instance for rich query support:

| Database | Documents | Indexes |
|----------|-----------|---------|
| `_users` | User credentials | Primary |
| `_replicator` | Replication jobs | Primary |
| `medicalrecords_anchor` | Medical anchors | By patientID, dataID, timestamp |
| `consent_registry` | Consent records | By patientID, recipientID, status |
| `access_audit` | Audit trails | By userID, resourceID, timestamp |
| `data_lineage` | Lineage records | By dataID, ownerID |
| `deletion_requests` | Deletion requests | By patientID, status |
| `key_metadata` | Key registry | By keyID, creatorID |

### 5.3 IPFS Integration

```mermaid
graph TB
    subgraph "IPFS Architecture"
        subgraph "IPFS Cluster"
            IPFS1[IPFS Node 1<br/>5001 API]
            IPFS2[IPFS Node 2<br/>5002 API]
            IPFS3[IPFS Node 3<br/>5003 API]
        end
        
        Cluster[IPFS Cluster<br/>Daemon]
        Pin[Pin Set Service<br/>Replication Factor: 2]
        Pin --> IPFS1
        Pin --> IPFS2
        Pin --> IPFS3
    end

    subgraph "S.M.I.L.E"
        BC[Blockchain Service]
        Medical[Medical Service]
    end

    Medical -->|"Upload DICOM"| BC
    BC -->|"add(file)"| Cluster
    Cluster -->|"CID"| BC
    BC -->|"pin(CID)"| Pin
    BC -->|"Store CID on-chain"| Fabric
```

**IPFS Configuration**:
- Cluster with 3 nodes
- Replication factor: 2
- Pinning strategy: Patient consent-based
- Garbage collection: Monthly
- Content routing: DHT

---

## 6. Event Streaming

### 6.1 Kafka Event Architecture

```mermaid
graph TB
    subgraph "Hyperledger Fabric"
        Peer1[Peer 0 Org1]
        Peer2[Peer 0 Org2]
        Events[Block Events<br/>Transaction Events]
    end

    subgraph "Kafka Cluster"
        Topic1[topic-smile-block-events]
        Topic2[topic-smile-anchor-events]
        Topic3[topic-smile-consent-events]
        Topic4[topic-smile-audit-events]
        Topic5[topic-smile-deletion-events]
        Topic6[topic-smile-lineage-events]
        Topic7[topic-smile-crosschain-events]
        Topic8[topic-smile-metrics]
    end

    subgraph "Consumers"
        Notif[Notification<br/>Service]
        Analytics[Analytics<br/>Service]
        Monitor[Monitoring<br/>Prometheus]
        Backup[Backup<br/>Service]
    end

    Peer1 -->|"Produce"| Topic1
    Peer2 -->|"Produce"| Topic1
    
    Topic1 -->|"Consume"| Topic2
    Topic1 -->|"Consume"| Topic3
    Topic1 -->|"Consume"| Topic4
    Topic1 -->|"Consume"| Topic5
    Topic1 -->|"Consume"| Topic6
    Topic1 -->|"Consume"| Topic7
    
    Topic8 --> Monitor
    Topic2 --> Notif
    Topic2 --> Backup
    Topic3 --> Analytics
    Topic4 --> Analytics
```

### 6.2 Kafka Topics

| Topic | Partitions | Retention | Description |
|-------|------------|-----------|-------------|
| `topic-smile-block-events` | 6 | 7 days | Raw Fabric block events |
| `topic-smile-anchor-events` | 3 | 30 days | Medical data anchoring events |
| `topic-smile-consent-events` | 3 | 30 days | Consent grant/withdraw events |
| `topic-smile-audit-events` | 6 | 90 days | Access audit trail events |
| `topic-smile-deletion-events` | 3 | 90 days | Deletion request lifecycle |
| `topic-smile-lineage-events` | 3 | 30 days | Data provenance events |
| `topic-smile-crosschain-events` | 3 | 30 days | Cross-org sharing events |
| `topic-smile-metrics` | 1 | 7 days | Performance metrics |

---

## 7. High Availability

### 7.1 Raft Consensus HA

```mermaid
graph TB
    subgraph "Raft Cluster"
        subgraph "Leader"
            L[Orderer 1<br/>Leader<br/>Writes]
        end
        
        subgraph "Followers"
            F1[Orderer 2<br/>Follower<br/>Replicates]
            F2[Orderer 3<br/>Follower<br/>Replicates]
        end
    end

    Client[Blockchain Service] -->|"Propose"| L
    L -->|"Append Entries"| F1
    L -->|"Append Entries"| F2
    F1 -->|"Ack"| L
    F2 -->|"Ack"| L
    L -->|"Commit"| Client

    Note over L,F1: If Leader fails:<br/>Election timeout →<br/>New leader elected
```

### 7.2 Failure Scenarios

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| Single orderer failure | Raft heartbeat timeout | Auto-elect new leader from remaining 2 |
| Network partition | Majority unreachable | Cluster becomes unavailable until partition heals |
| Peer failure | Health check + gossip | Traffic rerouted to surviving peer |
| CouchDB failure | Connection check | Peer continues with cached state |
| CA failure | TLS cert expiry | Manual intervention required |

---

## 8. Security Architecture

### 8.1 TLS Configuration

| Component | TLS Version | Cipher Suites |
|-----------|-------------|---------------|
| Orderer ↔ Orderer | TLS 1.3 | TLS_AES_256_GCM_SHA384 |
| Peer ↔ Orderer | TLS 1.3 | TLS_AES_256_GCM_SHA384 |
| Client ↔ Peer | TLS 1.3 | TLS_AES_256_GCM_SHA384 |
| Peer ↔ Peer (gossip) | TLS 1.2 | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 |
| CouchDB ↔ Peer | TLS 1.2 | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 |

### 8.2 Certificate Hierarchy

```mermaid
graph TB
    RootCA[Root CA<br/>(External)]
    OrdererCA[Orderer TLS CA<br/>Intermediate]
    Org1CA[Org1 TLS CA<br/>Intermediate]
    Org2CA[Org2 TLS CA<br/>Intermediate]
    
    OrdererCA -.-> RootCA
    Org1CA -.-> RootCA
    Org2CA -.-> RootCA
    
    OrdererTLS[Orderer<br/>TLS Cert]
    Org1TLS[Org1<br/>TLS Cert]
    Org2TLS[Org2<br/>TLS Cert]
    
    OrdererTLS --> OrdererCA
    Org1TLS --> Org1CA
    Org2TLS --> Org2CA
    
    O1[Orderer 1]
    O2[Orderer 2]
    O3[Orderer 3]
    P1[Peer Org1]
    P2[Peer Org2]
    
    O1 --> OrdererTLS
    O2 --> OrdererTLS
    O3 --> OrdererTLS
    P1 --> Org1TLS
    P2 --> Org2TLS
```

### 8.3 MSP Structure

Each organization has an MSP (Membership Service Provider) with:

```
msp/
├── config.yaml          # NodeOUs for identity categorization
├── cacerts/             # CA certificates
├── intermediatecerts/   # Intermediate CA certificates
├── tlscacerts/          # TLS CA certificates
├── crls/                # Certificate revocation lists
├── keystore/            # Signing keys (NOT in production)
└── signcerts/           # Enrolled certificates
```

---

## 9. Deployment Configuration

### 9.1 Docker Compose Configuration

The Fabric network is deployed using Docker Compose:

```yaml
# Key excerpts from docker-compose-fabric.yml
services:
  orderer.example.com:
    image: hyperledger/fabric-orderer:2.5
    environment:
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_CLUSTER_CLIENTCERT=...
      - ORDERER_GENERAL_CLUSTER_CLIENTKEY=...
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[...]
    volumes:
      - ./channel-artifacts:/var/hyperledger/orderer/orderer.genesis.block
      - ./crypto-config:/var/hyperledger/orderer/msp
    networks:
      - smile-fabric-network

  peer0.org1.example.com:
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org2.example.com:9051
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0:5984
      - CORE_PEER_TLS_ENABLED=true
    volumes:
      - /var/run:/var/run
      - ./crypto-config:/etc/hyperledger/fabric
```

### 9.2 Resource Requirements

| Component | CPU | Memory | Disk | Network |
|-----------|-----|--------|------|---------|
| Orderer | 2 cores | 2 GB | 50 GB | 1 Gbps |
| Peer | 2 cores | 4 GB | 100 GB | 1 Gbps |
| CouchDB | 1 core | 2 GB | 50 GB | 1 Gbps |
| CA | 1 core | 1 GB | 10 GB | 1 Gbps |

---

## Appendix: Network Configuration Files

### A.1 Core Configuration Locations

| File | Path | Purpose |
|------|------|---------|
| Docker Compose | `blockchain/network/docker-compose-fabric.yml` | Network definition |
| Crypto Material | `blockchain/network/crypto-config/` | Certificates & keys |
| Channel Artifacts | `blockchain/network/channel-artifacts/` | Genesis block, channel tx |
| Chaincode | `blockchain/chaincode/` | All 7 Go chaincodes |
| Connection Profile | `blockchain/network/connection-org1.yaml` | Gateway connection |

---

*Document Version: 1.0*  
*Last Updated: March 2026*  
*S.M.I.L.E - Smart Medical Intelligent Ledger for E-health*

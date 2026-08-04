# Report 7 — front matter

Drafted for **SEP490_G5 — S.M.I.L.E (Smart Medical Intelligent Ledger for E-health)**.
Technology names, integrations and acronyms are taken from the repository; the
counts in brackets are how often each acronym appears across Reports 1–6.

> **Fill before submitting** — the repository does not contain these, so they are
> left as placeholders rather than guessed:
> `[SUPERVISOR TITLE AND FULL NAME]`, `[CAMPUS]`, and the five full member names.

---

## Acknowledgement

As we reach the end of our capstone journey, we look back not only with pride in what we
have built, but with genuine gratitude for the people, the knowledge, and the long nights
that shaped **S.M.I.L.E — Smart Medical Intelligent Ledger for E-health**.

This project is more than a repository of services and screens. It is the product of a team
learning to reason about other people's health data with the seriousness it deserves — of
arguments about whether a finalized medical record should ever be editable, of a booking
system rewritten until two patients could no longer hold the same slot, and of a shared
conviction that a dental clinic in Vietnam deserves software as careful as its clinicians.

First and foremost, we are deeply grateful to our supervisor, **[SUPERVISOR TITLE AND FULL
NAME]**, whose guidance turned a broad ambition into a system with real boundaries. The
questions asked of us — about data ownership, about what happens when an integration fails,
about who is accountable for a clinical record — did more to shape this platform than any
feature request could have.

We also thank the faculty of the Information Technology Department at **FPT University,
[CAMPUS]**. The foundations laid over the past four years are visible in every design
decision we made, including the ones we had to make twice.

To our teammates in **SEP490_G5** — **[FULL NAME]**, **[FULL NAME]**, **[FULL NAME]**,
**[FULL NAME]** and **[FULL NAME]** — thank you for the persistence this took. Six
microservices, five databases, two AI services and eighty-seven use cases were not built by
anyone working alone. What we will remember is not the commit count but the willingness to
delete work that was wrong and build it again properly.

We are grateful to the open-source community whose tools carried this project: **Next.js**
and **React** for the web application, **NestJS** and **TypeScript** for the services,
**PostgreSQL** and **TypeORM** for the data our design depends on, **Redis**, **Docker**,
and on the AI side **Python**, **PyTorch**, **ONNX Runtime**, **YOLOv11**, **VietOCR** and
**LangGraph**. We also thank **VNPay**, **Google** and **Cloudinary**, whose platforms let a
student project behave like a real one.

To our families and friends — thank you for the patience. You absorbed the missed dinners
and the distracted conversations, and asked how it was going even when the answer was long.

S.M.I.L.E ends here as a capstone, but the habits it taught us do not: verify before you
claim, prefer the boring correct solution, and remember that behind every row in a database
there is a person who trusted you with it.

To everyone who walked this road with us — thank you.

> *"This is not the end, it is not even the beginning of the end, but it is perhaps the end
> of the beginning."* — Winston Churchill

---

## Definition and Acronyms

| Acronym | Definition |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| BA | Business Analysis |
| BR | Business Rule |
| CBCT | Cone Beam Computed Tomography — 3D dental imaging |
| CCCD | Căn cước công dân — Vietnamese Citizen Identity Card, the document used for KYC |
| CI/CD | Continuous Integration / Continuous Deployment |
| DICOM | Digital Imaging and Communications in Medicine |
| EMR | Electronic Medical Record |
| ERD | Entity Relationship Diagram |
| GDPR | General Data Protection Regulation |
| GUI | Graphical User Interface |
| HIPAA | Health Insurance Portability and Accountability Act |
| HIS | Hospital Information System |
| IAM | Identity and Access Management — the service owning authentication, RBAC and KYC |
| ICD | International Classification of Diseases — diagnosis coding standard |
| ISO/IEC | International Organization for Standardization / International Electrotechnical Commission |
| JWT | JSON Web Token |
| KYC | Know Your Customer — the identity verification workflow |
| OAuth | Open Authorization — the protocol behind Google federated sign-in |
| OCR | Optical Character Recognition |
| ORM | Object Relational Mapping |
| OTP | One-Time Password |
| OWASP | Open Worldwide Application Security Project |
| PACS | Picture Archiving and Communication System |
| PHI | Protected Health Information |
| PM | Project Manager |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SDD | Software Design Description |
| S.M.I.L.E | Smart Medical Intelligent Ledger for E-health — this project |
| SMS | Short Message Service |
| SPMP | Software Project Management Plan |
| SQL | Structured Query Language |
| SRS | Software Requirement Specification |
| TLS | Transport Layer Security |
| UAT | User Acceptance Test |
| UC | Use Case |
| UI / UX | User Interface / User Experience |
| VNPay | Vietnamese payment gateway used for appointment charges and refunds |
| WCAG | Web Content Accessibility Guidelines |
| WSL | Windows Subsystem for Linux |
| YOLO | You Only Look Once — the object detection model family (YOLOv11) used by the KYC OCR service |

### Changes from the template

| Template entry | Action | Reason |
|---|---|---|
| PWM — Psychology website | **removed** | Belongs to a different project; 0 occurrences in Reports 1–6 |
| AWS — Amazon Web Services | **removed** | Not used — the stack is Docker Compose / Docker Swarm; 0 occurrences |
| — | **30 added** | KYC (58), VNPay (52), OCR (24), EMR (22), IAM (21), SMS (19), CBCT (16), OAuth (16), OTP (14), PACS (12), WSL (11), RBAC (10), TLS (8), JWT (6), CCCD (5), ICD (4), OWASP (4), PHI (4), CI/CD (3), REST (3), and others actually used in the documents |

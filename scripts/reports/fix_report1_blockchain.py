"""Remove blockchain from Report 1 and describe the integrity mechanism that exists.

Blockchain, Hyperledger Fabric and IPFS are dropped features — there is no such
code in the repository. What the system actually provides instead:

  * finalized medical records are immutable; an amendment writes a new snapshot
    into medical_record_versions rather than editing the record
  * every access to clinical data is written to a tamper-evident audit_logs table
  * KYC documents are stored AES-encrypted
  * clinical media lives in managed cloud object storage, not IPFS

Each edit below rewrites a claim into one of those, keeping the sentence's shape.

Usage:
  python3 scripts/reports/fix_report1_blockchain.py            # preview
  python3 scripts/reports/fix_report1_blockchain.py --docx     # apply
"""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams"))

import docx_table as D  # noqa: E402
from fix_report1_text import apply  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REPORT1 = os.path.join(ROOT, "docs", "testing", "Final", "Report1_Project Introduction.docx")

EDITS = [
    # Executive summary
    ("Built upon a robust technological foundation of Hyperledger Fabric blockchain and DentalMultiTaskNet AI",
     "Built upon a robust technological foundation of tamper-evident record keeping and AI-assisted services"),
    ("By leveraging a microservices architecture and IPFS decentralized storage for high-resolution medical imaging",
     "By leveraging a microservices architecture and managed cloud object storage for high-resolution medical imaging"),

    # Vision
    ("S.M.I.L.E envisions a future where blockchain technology and artificial intelligence",
     "S.M.I.L.E envisions a future where verifiable digital records and artificial intelligence"),
    ("AI-assisted consultations, blockchain-verified medical records, and teledentistry services",
     "AI-assisted consultations, version-controlled medical records with a full audit trail, and teledentistry services"),
    ("streamlined appointment management, blockchain-verified patient records ensuring data integrity",
     "streamlined appointment management, audit-logged patient records ensuring data integrity"),
    ("S.M.I.L.E differentiates itself through blockchain-first architecture, specialized AI diagnostic capabilities",
     "S.M.I.L.E differentiates itself through a security-first architecture, specialized AI capabilities"),
    ("The platform leverages Hyperledger Fabric for immutable records, integrates with Vietnamese payment systems",
     "The platform leverages append-only record versioning and tamper-evident audit logging for immutable records, "
     "integrates with Vietnamese payment systems"),

    # Scope
    ("The S.M.I.L.E project focuses on being a blockchain-secured, AI-enhanced dental practice management platform",
     "The S.M.I.L.E project focuses on being a security-hardened, AI-enhanced dental practice management platform"),
    ("centers around utilizing cutting-edge blockchain technology and artificial intelligence",
     "centers around utilizing modern data-integrity engineering and artificial intelligence"),
    ("blockchain-verified medical records using Hyperledger Fabric, intelligent appointment scheduling",
     "version-controlled medical records with a tamper-evident audit trail, intelligent appointment scheduling"),
    ("While the project emphasizes blockchain security and AI-driven clinical assistance",
     "While the project emphasizes data security and AI-driven clinical assistance"),
    ("By focusing on blockchain-secured data integrity and AI-enhanced diagnostics as the backbone",
     "By focusing on end-to-end data integrity and AI-enhanced diagnostics as the backbone"),

    # Major features
    ("while maintaining the highest standards of data security through blockchain technology",
     "while maintaining the highest standards of data security through encryption, access control "
     "and tamper-evident audit logging"),
    ("FE-02. Blockchain Record Verification: Enables immutable medical record integrity through "
     "Hyperledger Fabric blockchain technology, allowing patients and practitioners to verify",
     "FE-02. Record Integrity Verification: Enables immutable medical record integrity through "
     "append-only version snapshots and a tamper-evident audit trail, allowing patients and "
     "practitioners to verify"),
    ("The system's blockchain-first architecture ensures data integrity and patient privacy",
     "The system's security-first architecture ensures data integrity and patient privacy"),
]

TERMS = ["blockchain", "hyperledger", "ipfs", "on-chain", "off-chain", "distributed ledger"]


def count_terms(xml: str) -> dict[str, int]:
    low = D.text(xml).lower()
    return {t: low.count(t) for t in TERMS if low.count(t)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true")
    args = ap.parse_args()

    names, blobs, xml = D.load(REPORT1)
    print("before:", count_terms(xml) or "clean")
    print()

    missing = []
    for find, repl in EDITS:
        xml, ok = apply(xml, find, repl)
        if not ok:
            missing.append(find)
        print("  %-9s %s" % ("OK" if ok else "NOT FOUND", find[:88]))
        if ok:
            print("            -> %s" % repl[:88])

    print("\nafter :", count_terms(xml) or "clean")
    if missing:
        print("\n  %d edit(s) not located — nothing written" % len(missing))
        return

    left = count_terms(xml)
    if left:
        print("\n  WARNING: %s still present — review the passages above" % left)

    if not args.docx:
        print("\n  preview only; pass --docx to apply")
        return

    backup_dir = os.path.join(os.path.dirname(REPORT1), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    backup = os.path.join(backup_dir, os.path.basename(REPORT1).replace(
        ".docx", ".BAK-%s.docx" % time.strftime("%Y%m%d-%H%M%S")))
    shutil.copy(REPORT1, backup)
    D.save(REPORT1, names, blobs, xml)
    print("\n  backup %s" % os.path.relpath(backup, ROOT))
    print("  wrote  %s" % os.path.relpath(REPORT1, ROOT))


if __name__ == "__main__":
    main()

from __future__ import annotations

import re
from pathlib import Path
from uuid import UUID


ROOT = Path(__file__).resolve().parents[4]
SEED_FILE = ROOT / "backend/service/clinical-emr-service/src/database/seeds/relational/clinic/run-clinic-seed.ts"
UUID_LITERAL = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)


def test_clinic_seed_uuid_literals_match_api_uuid_validator_shape():
    seed = SEED_FILE.read_text()
    uuid_literals = sorted(set(UUID_LITERAL.findall(seed)))

    assert uuid_literals
    invalid = []
    for value in uuid_literals:
        parsed = UUID(value)
        if parsed.version not in {1, 3, 4, 5}:
            invalid.append(value)

    assert invalid == []

"""Regenerate every SRS diagram and table from the repo.

  python3 scripts/diagrams/generate_all.py           # diagrams + markdown tables
  python3 scripts/diagrams/generate_all.py --docx    # also rewrite the Report3 tables

Exits non-zero if the screen catalogue, the entity descriptions or the route
guards have drifted, so it is safe to run in CI as a documentation check.
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gen_dbml
import gen_drawio_erd
import gen_erd_puml
import gen_mermaid
import gen_schema_svg
import gen_sdd_tables
import gen_screenflow_puml
import gen_screenflow_svg
import gen_srs_tables
from entity_names import check
from schema_reader import load_schema
from screens import verify


def preflight() -> None:
    problems = verify() + check([t.name for t in load_schema()])
    if problems:
        print("documentation is out of sync with the repo:")
        for p in problems:
            print("  -", p)
        raise SystemExit(1)
    print("preflight OK — catalogue matches the app router and the schema")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--docx", action="store_true", help="also rewrite the tables in Report3")
    args = ap.parse_args()

    preflight()

    print("\nentity relationship diagrams:")
    gen_erd_puml.generate()

    print("\nscreen flows:")
    gen_screenflow_puml.generate()

    print("\nmermaid copies (render on GitHub without PlantUML):")
    gen_mermaid.generate()

    print("\ndbdiagram.io (DBML):")
    gen_dbml.generate()

    print("\neditable draw.io ERD (Chen notation):")
    gen_drawio_erd.generate()

    print("\nscreen flow images:")
    gen_screenflow_svg.generate()

    print("\nschema images:")
    gen_schema_svg.generate()

    print("\nSRS tables (Report3):")
    sys.argv = ["gen_srs_tables"] + (["--docx"] if args.docx else [])
    gen_srs_tables.main()

    print("\nSDD database design (Report4 §2):")
    sys.argv = ["gen_sdd_tables"] + (["--docx"] if args.docx else [])
    gen_sdd_tables.main()


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dental_disease_service.dataset import summarize_yolo_dataset, validate_yolo_dataset, write_data_yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare and validate the dental YOLO dataset.")
    parser.add_argument(
        "--dataset-root",
        type=Path,
        default=Path(r"D:\DAI_NHAN\roboflow\oral-diseases-5ctay"),
        help="Roboflow dataset root containing train/valid/test folders.",
    )
    parser.add_argument("--output", type=Path, default=None, help="Optional output YAML path.")
    parser.add_argument("--allow-missing-labels", action="store_true")
    parser.add_argument(
        "--skip-validate",
        action="store_true",
        help="Only write data_smile.yaml. Use after the dataset has already been validated.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    yaml_path = write_data_yaml(args.dataset_root, args.output)
    if args.skip_validate:
        print(f"data_yaml={yaml_path}")
        print("validation=skipped")
        return
    summary = summarize_yolo_dataset(yaml_path) if args.allow_missing_labels else validate_yolo_dataset(yaml_path)
    print(f"data_yaml={yaml_path}")
    print(f"dataset_root={summary.dataset_root}")
    for split in ("train", "valid", "test"):
        print(
            f"{split}: images={summary.image_counts[split]} "
            f"labels={summary.label_counts[split]} "
            f"missing={summary.missing_label_counts[split]} "
            f"empty={summary.empty_label_counts[split]}"
        )
    print("class_counts=" + ", ".join(f"{k}:{v}" for k, v in sorted(summary.class_counts.items())))


if __name__ == "__main__":
    main()

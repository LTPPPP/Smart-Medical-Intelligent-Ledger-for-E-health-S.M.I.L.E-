from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
import re

DENTAL_DISEASE_CLASSES = (
    "calculus",
    "caries",
    "gingivitis",
    "hypodontia",
    "tooth_discoloration",
    "ulcer",
)


class DatasetValidationError(ValueError):
    """Raised when a YOLO dataset is missing required files or labels are invalid."""


@dataclass(frozen=True)
class DatasetSummary:
    yaml_path: Path
    dataset_root: Path
    image_counts: dict[str, int]
    label_counts: dict[str, int]
    missing_label_counts: dict[str, int]
    empty_label_counts: dict[str, int]
    class_counts: Counter[int] = field(default_factory=Counter)
    invalid_label_count: int = 0
    invalid_examples: tuple[str, ...] = ()


def write_data_yaml(dataset_root: str | Path, output_path: str | Path | None = None) -> Path:
    root = Path(dataset_root).resolve()
    yaml_path = Path(output_path).resolve() if output_path else root / "data_smile.yaml"
    class_lines = "\n".join(
        f"  {idx}: {name}" for idx, name in enumerate(DENTAL_DISEASE_CLASSES)
    )
    yaml_path.write_text(
        "\n".join(
            (
                f"path: {root.as_posix()}",
                "train: train/images",
                "val: valid/images",
                "test: test/images",
                "",
                f"nc: {len(DENTAL_DISEASE_CLASSES)}",
                "names:",
                class_lines,
                "",
            )
        ),
        encoding="utf-8",
    )
    return yaml_path


def summarize_yolo_dataset(yaml_path: str | Path) -> DatasetSummary:
    config_path = Path(yaml_path).resolve()
    config = _read_simple_yaml(config_path)
    root = Path(config.get("path", config_path.parent)).expanduser()
    if not root.is_absolute():
        root = (config_path.parent / root).resolve()
    else:
        root = root.resolve()

    split_paths = {
        "train": config.get("train", "train/images"),
        "valid": config.get("val", config.get("valid", "valid/images")),
        "test": config.get("test", "test/images"),
    }

    image_counts: dict[str, int] = {}
    label_counts: dict[str, int] = {}
    missing_label_counts: dict[str, int] = {}
    empty_label_counts: dict[str, int] = {}
    class_counts: Counter[int] = Counter()
    invalid_examples: list[str] = []
    invalid_label_count = 0

    for split, image_ref in split_paths.items():
        image_dir = _resolve_dataset_path(root, image_ref)
        label_dir = image_dir.parent / "labels"
        images = sorted(p for p in image_dir.glob("*") if p.suffix.lower() in _IMAGE_SUFFIXES)
        labels = sorted(label_dir.glob("*.txt")) if label_dir.exists() else []

        image_counts[split] = len(images)
        label_counts[split] = len(labels)
        missing_label_counts[split] = sum(
            1 for image in images if not (label_dir / f"{image.stem}.txt").exists()
        )
        empty_label_counts[split] = sum(1 for label in labels if label.stat().st_size == 0)

        for label in labels:
            bad_rows, row_classes = _parse_label_file(label)
            class_counts.update(row_classes)
            invalid_label_count += len(bad_rows)
            invalid_examples.extend(bad_rows[: max(0, 10 - len(invalid_examples))])

    return DatasetSummary(
        yaml_path=config_path,
        dataset_root=root,
        image_counts=image_counts,
        label_counts=label_counts,
        missing_label_counts=missing_label_counts,
        empty_label_counts=empty_label_counts,
        class_counts=class_counts,
        invalid_label_count=invalid_label_count,
        invalid_examples=tuple(invalid_examples[:10]),
    )


def validate_yolo_dataset(yaml_path: str | Path) -> DatasetSummary:
    summary = summarize_yolo_dataset(yaml_path)
    structural_errors: list[str] = []

    for split in ("train", "valid"):
        if summary.image_counts.get(split, 0) == 0:
            structural_errors.append(f"{split} has no images")
        if summary.label_counts.get(split, 0) == 0:
            structural_errors.append(f"{split} has no labels")

    for split, missing in summary.missing_label_counts.items():
        if missing:
            structural_errors.append(f"{split} is missing {missing} label files")

    if summary.invalid_label_count:
        examples = "; ".join(summary.invalid_examples)
        raise DatasetValidationError(
            f"Invalid YOLO labels: {summary.invalid_label_count}. {examples}"
        )

    if structural_errors:
        raise DatasetValidationError("; ".join(structural_errors))

    return summary


_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def _read_simple_yaml(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip("'\"")
    return data


def _resolve_dataset_path(root: Path, value: str) -> Path:
    value = value.strip().strip("'\"")
    path = Path(value)
    if path.is_absolute():
        return path.resolve()
    return (root / path).resolve()


def _parse_label_file(path: Path) -> tuple[list[str], list[int]]:
    invalid: list[str] = []
    classes: list[int] = []
    for line_no, raw_line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        line = raw_line.strip()
        if not line:
            continue
        parts = re.split(r"\s+", line)
        if len(parts) != 5:
            invalid.append(f"{path}:{line_no}: expected 5 fields")
            continue
        try:
            class_id = int(float(parts[0]))
            x_center, y_center, width, height = (float(value) for value in parts[1:])
        except ValueError:
            invalid.append(f"{path}:{line_no}: non-numeric label")
            continue
        classes.append(class_id)
        if class_id < 0 or class_id >= len(DENTAL_DISEASE_CLASSES):
            invalid.append(f"{path}:{line_no}: class id {class_id} out of range")
        if not all(0 <= value <= 1 for value in (x_center, y_center, width, height)):
            invalid.append(f"{path}:{line_no}: bbox values must be normalized")
        if width <= 0 or height <= 0:
            invalid.append(f"{path}:{line_no}: bbox width/height must be positive")
    return invalid, classes

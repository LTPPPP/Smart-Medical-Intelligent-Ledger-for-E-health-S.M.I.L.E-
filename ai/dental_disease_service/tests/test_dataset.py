from pathlib import Path

import pytest

from dental_disease_service.dataset import (
    DENTAL_DISEASE_CLASSES,
    DatasetValidationError,
    summarize_yolo_dataset,
    validate_yolo_dataset,
    write_data_yaml,
)


def _write_dataset(root: Path) -> Path:
    for split in ("train", "valid", "test"):
        (root / split / "images").mkdir(parents=True)
        (root / split / "labels").mkdir(parents=True)
        for idx in range(2):
            stem = f"{split}_{idx}"
            (root / split / "images" / f"{stem}.jpg").write_bytes(b"fake")
            (root / split / "labels" / f"{stem}.txt").write_text(
                f"{idx % len(DENTAL_DISEASE_CLASSES)} 0.5 0.5 0.2 0.2\n",
                encoding="utf-8",
            )
    return root


def test_write_data_yaml_uses_absolute_dataset_path(tmp_path: Path) -> None:
    dataset_root = _write_dataset(tmp_path / "oral-diseases")

    yaml_path = write_data_yaml(dataset_root)

    content = yaml_path.read_text(encoding="utf-8")
    assert f"path: {dataset_root.as_posix()}" in content
    assert "train: train/images" in content
    assert "val: valid/images" in content
    assert "test: test/images" in content
    assert "4: tooth_discoloration" in content


def test_validate_yolo_dataset_returns_counts_and_distribution(tmp_path: Path) -> None:
    dataset_root = _write_dataset(tmp_path / "oral-diseases")
    yaml_path = write_data_yaml(dataset_root)

    summary = validate_yolo_dataset(yaml_path)

    assert summary.image_counts == {"train": 2, "valid": 2, "test": 2}
    assert summary.label_counts == {"train": 2, "valid": 2, "test": 2}
    assert summary.invalid_label_count == 0
    assert summary.class_counts[0] == 3
    assert summary.class_counts[1] == 3


def test_validate_yolo_dataset_rejects_invalid_bbox(tmp_path: Path) -> None:
    dataset_root = _write_dataset(tmp_path / "oral-diseases")
    (dataset_root / "train" / "labels" / "train_0.txt").write_text(
        "0 1.2 0.5 0.2 0.2\n",
        encoding="utf-8",
    )
    yaml_path = write_data_yaml(dataset_root)

    with pytest.raises(DatasetValidationError, match="Invalid YOLO labels"):
        validate_yolo_dataset(yaml_path)


def test_summarize_yolo_dataset_reports_missing_labels(tmp_path: Path) -> None:
    dataset_root = _write_dataset(tmp_path / "oral-diseases")
    (dataset_root / "valid" / "labels" / "valid_1.txt").unlink()
    yaml_path = write_data_yaml(dataset_root)

    summary = summarize_yolo_dataset(yaml_path)

    assert summary.missing_label_counts["valid"] == 1

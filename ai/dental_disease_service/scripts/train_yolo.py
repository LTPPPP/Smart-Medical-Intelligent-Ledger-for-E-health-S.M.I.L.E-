from __future__ import annotations

import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dental_disease_service.dataset import validate_yolo_dataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a YOLO dental disease baseline.")
    parser.add_argument(
        "--data-yaml",
        type=Path,
        default=Path(r"D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml"),
    )
    parser.add_argument("--model", default="yolo11n.pt")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--patience", type=int, default=7)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--device", default=0)
    parser.add_argument("--project", type=Path, default=Path("runs/dental_detection"))
    parser.add_argument("--name", default="yolo11n_oral_diseases")
    parser.add_argument("--fraction", type=float, default=1.0)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--skip-validate", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.skip_validate:
        summary = validate_yolo_dataset(args.data_yaml)
        print(f"Validated dataset: {summary.dataset_root}")

    from ultralytics import YOLO

    model = YOLO(args.model)
    results = model.train(
        data=str(args.data_yaml),
        epochs=args.epochs,
        patience=args.patience,
        imgsz=args.imgsz,
        batch=args.batch,
        workers=args.workers,
        device=args.device,
        project=str(args.project),
        name=args.name,
        fraction=args.fraction,
        resume=args.resume,
    )
    print(f"train_results={results}")


if __name__ == "__main__":
    main()

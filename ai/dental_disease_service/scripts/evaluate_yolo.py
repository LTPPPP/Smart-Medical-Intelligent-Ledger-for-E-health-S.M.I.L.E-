from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dental_disease_service.dataset import validate_yolo_dataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained YOLO dental disease model.")
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument(
        "--data-yaml",
        type=Path,
        default=Path(r"D:\DAI_NHAN\roboflow\oral-diseases-5ctay\data_smile.yaml"),
    )
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--device", default=0)
    parser.add_argument("--split", default="test", choices=("val", "test"))
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--skip-validate", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.skip_validate:
        validate_yolo_dataset(args.data_yaml)

    from ultralytics import YOLO

    model = YOLO(str(args.weights))
    metrics = model.val(
        data=str(args.data_yaml),
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        split=args.split,
    )
    output = {
        "weights": str(args.weights),
        "split": args.split,
        "box_map": float(metrics.box.map),
        "box_map50": float(metrics.box.map50),
        "box_map75": float(metrics.box.map75),
        "box_maps": [float(value) for value in metrics.box.maps],
    }
    print(json.dumps(output, indent=2))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(output, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

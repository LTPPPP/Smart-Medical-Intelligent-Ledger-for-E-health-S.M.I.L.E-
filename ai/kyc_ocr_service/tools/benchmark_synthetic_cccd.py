from __future__ import annotations

import argparse
import json
import math
import random
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from src.service import CccdOcrService


@dataclass(frozen=True)
class ExpectedFields:
    id_number: str = "012345678901"
    full_name: str = "NGUYEN VAN A"
    date_of_birth: str = "1990-01-01"
    issue_date: str = "2020-02-01"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate mock Vietnamese CCCD images and benchmark fast OCR.")
    parser.add_argument("--output-dir", type=Path, default=Path(tempfile.gettempdir()) / "smile_cccd_fast_benchmark")
    parser.add_argument("--json", action="store_true", help="Print full JSON output.")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    expected = ExpectedFields()
    images = generate_benchmark_images(args.output_dir)
    service = CccdOcrService()

    results = []
    for name, image_path, expected_side in images:
        response = (
            service.analyze_back(image_path)
            if expected_side == "BACK"
            else service.analyze_front(image_path)
        )
        result = {
            "variant": name,
            "image": str(image_path),
            "expected_side": expected_side,
            "actual": response.fields.model_dump(),
            "risk_level": response.risk_level,
            "avg_confidence": _avg_confidence(response),
            "line_count": len(response.lines),
            "id_match": response.fields.id_number == expected.id_number if expected_side == "FRONT" else None,
            "dob_match": response.fields.date_of_birth == expected.date_of_birth if expected_side == "FRONT" else None,
            "name_match": _name_matches(response.fields.full_name, expected.full_name) if expected_side == "FRONT" else None,
            "side_match": response.fields.side == expected_side,
            "failed_checks": [
                key for key, check in response.checks.items() if check.status == "FAIL"
            ],
            "warning_checks": [
                key for key, check in response.checks.items() if check.status == "WARNING"
            ],
            "raw_text": response.raw_text,
        }
        results.append(result)

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        _print_summary(results, args.output_dir)


def generate_benchmark_images(output_dir: Path) -> list[tuple[str, Path, str]]:
    random.seed(42)
    front = _draw_front_card()
    back = _draw_back_card()

    variants = [
        ("front_clean", front, "FRONT"),
        ("front_rotated", front.rotate(6, expand=True, fillcolor=(235, 240, 246)), "FRONT"),
        ("front_blurred", front.filter(ImageFilter.GaussianBlur(radius=2.0)), "FRONT"),
        ("front_low_light", ImageEnhance.Brightness(front).enhance(0.42), "FRONT"),
        ("front_glare", _add_glare(front), "FRONT"),
        ("front_small", front.resize((640, 404)).resize(front.size), "FRONT"),
        ("front_perspective", _perspective_warp(front), "FRONT"),
        ("front_screen_capture", _simulate_screen_capture(front), "FRONT"),
        ("back_clean", back, "BACK"),
        ("back_rotated", back.rotate(-5, expand=True, fillcolor=(235, 240, 246)), "BACK"),
    ]

    saved: list[tuple[str, Path, str]] = []
    for name, image, expected_side in variants:
        path = output_dir / f"{name}.jpg"
        image.convert("RGB").save(path, quality=95)
        saved.append((name, path, expected_side))
    return saved


def _draw_front_card() -> Image.Image:
    img = _base_card()
    draw = ImageDraw.Draw(img)
    title_font = _font(33, bold=True)
    h1_font = _font(38, bold=True)
    label_font = _font(22)
    value_font = _font(30, bold=True)
    small_font = _font(18)

    draw.text((190, 38), "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", fill=(132, 25, 30), font=title_font)
    draw.text((250, 78), "SOCIALIST REPUBLIC OF VIET NAM", fill=(132, 25, 30), font=small_font)
    draw.text((335, 126), "CĂN CƯỚC CÔNG DÂN", fill=(24, 68, 134), font=h1_font)
    draw.text((393, 172), "Citizen Identity Card", fill=(24, 68, 134), font=small_font)

    _draw_emblem(draw, (90, 80))
    _draw_photo(draw, (75, 245), (230, 450))
    _draw_qr(draw, (760, 245), 125)

    draw.text((270, 234), "Số / No:", fill=(92, 92, 92), font=label_font)
    draw.text((375, 228), "012345678901", fill=(170, 30, 30), font=value_font)
    draw.text((270, 294), "Họ và tên / Full name:", fill=(92, 92, 92), font=label_font)
    draw.text((270, 326), "NGUYEN VAN A", fill=(18, 28, 43), font=value_font)
    draw.text((270, 386), "Ngày sinh / Date of birth:", fill=(92, 92, 92), font=label_font)
    draw.text((550, 380), "01/01/1990", fill=(18, 28, 43), font=value_font)
    draw.text((270, 442), "Giới tính / Sex: Nam", fill=(18, 28, 43), font=label_font)
    draw.text((545, 442), "Quốc tịch / Nationality: Việt Nam", fill=(18, 28, 43), font=label_font)
    draw.text((75, 510), "Quê quán / Place of origin: Hà Nội", fill=(18, 28, 43), font=label_font)
    draw.text((75, 560), "Nơi thường trú / Place of residence: Cầu Giấy, Hà Nội", fill=(18, 28, 43), font=label_font)
    draw.text((75, 620), "Có giá trị đến / Date of expiry: 01/01/2040", fill=(18, 28, 43), font=label_font)
    return img


def _draw_back_card() -> Image.Image:
    img = _base_card()
    draw = ImageDraw.Draw(img)
    label_font = _font(24)
    value_font = _font(28, bold=True)
    mrz_font = _font(30)

    _draw_chip(draw, (455, 75))
    draw.text((70, 105), "Đặc điểm nhận dạng / Personal identification:", fill=(60, 72, 92), font=label_font)
    draw.text((70, 145), "Nốt ruồi cách 1cm dưới sau mép trái", fill=(18, 28, 43), font=value_font)
    draw.text((70, 220), "Ngày cấp / Date of issue:", fill=(60, 72, 92), font=label_font)
    draw.text((360, 214), "01/02/2020", fill=(18, 28, 43), font=value_font)
    draw.text((70, 285), "Nơi cấp / Place of issue:", fill=(60, 72, 92), font=label_font)
    draw.text((70, 325), "Cục Cảnh sát QLHC về TTXH", fill=(18, 28, 43), font=value_font)
    _draw_fingerprint(draw, (120, 430))
    _draw_fingerprint(draw, (275, 430))
    draw.text((70, 610), "IDVNM012345678901<<<<<<<<<<<<<<<", fill=(18, 28, 43), font=mrz_font)
    draw.text((70, 655), "9001019M4001019VNM<<<<<<<<<<<8", fill=(18, 28, 43), font=mrz_font)
    return img


def _base_card() -> Image.Image:
    img = Image.new("RGB", (1012, 638), (236, 244, 252))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((18, 18, 994, 620), radius=30, fill=(248, 251, 255), outline=(200, 215, 234), width=3)
    for x in range(40, 970, 80):
        draw.line((x, 20, x + 240, 620), fill=(230, 239, 249), width=1)
    return img


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _draw_emblem(draw: ImageDraw.ImageDraw, center: tuple[int, int]) -> None:
    x, y = center
    draw.ellipse((x - 42, y - 42, x + 42, y + 42), fill=(185, 33, 43), outline=(245, 196, 73), width=4)
    draw.polygon([(x, y - 26), (x + 8, y - 4), (x + 30, y - 4), (x + 12, y + 8), (x + 20, y + 30), (x, y + 16), (x - 20, y + 30), (x - 12, y + 8), (x - 30, y - 4), (x - 8, y - 4)], fill=(245, 196, 73))


def _draw_photo(draw: ImageDraw.ImageDraw, top_left: tuple[int, int], bottom_right: tuple[int, int]) -> None:
    draw.rounded_rectangle((*top_left, *bottom_right), radius=18, fill=(219, 231, 244), outline=(135, 158, 184), width=2)
    x1, y1 = top_left
    x2, y2 = bottom_right
    cx = (x1 + x2) // 2
    draw.ellipse((cx - 36, y1 + 42, cx + 36, y1 + 114), fill=(130, 151, 176))
    draw.rounded_rectangle((cx - 60, y1 + 130, cx + 60, y2 - 25), radius=40, fill=(88, 112, 142))


def _draw_qr(draw: ImageDraw.ImageDraw, top_left: tuple[int, int], size: int) -> None:
    x, y = top_left
    cell = size // 11
    draw.rectangle((x, y, x + size, y + size), fill="white", outline=(30, 45, 65), width=2)
    for row in range(11):
        for col in range(11):
            if row in (0, 1, 9, 10) or col in (0, 1, 9, 10) or (row * 7 + col * 3) % 5 == 0:
                draw.rectangle((x + col * cell, y + row * cell, x + (col + 1) * cell, y + (row + 1) * cell), fill=(20, 30, 45))


def _draw_chip(draw: ImageDraw.ImageDraw, top_left: tuple[int, int]) -> None:
    x, y = top_left
    draw.rounded_rectangle((x, y, x + 120, y + 96), radius=12, fill=(205, 164, 68), outline=(120, 92, 39), width=3)
    for offset in (24, 48, 72):
        draw.line((x + offset, y + 8, x + offset, y + 88), fill=(120, 92, 39), width=2)
    draw.line((x + 8, y + 48, x + 112, y + 48), fill=(120, 92, 39), width=2)


def _draw_fingerprint(draw: ImageDraw.ImageDraw, top_left: tuple[int, int]) -> None:
    x, y = top_left
    for radius in range(18, 70, 10):
        draw.arc((x - radius, y - radius, x + radius, y + radius), 30, 330, fill=(80, 94, 115), width=2)


def _add_glare(image: Image.Image) -> Image.Image:
    img = image.copy().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse((520, 110, 1030, 580), fill=(255, 255, 255, 110))
    return Image.alpha_composite(img, overlay).convert("RGB")


def _perspective_warp(image: Image.Image) -> Image.Image:
    import cv2
    import numpy as np

    arr = np.array(image)
    h, w = arr.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[45, 20], [w - 70, 0], [w - 15, h - 35], [70, h]])
    matrix = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(arr, matrix, (w, h), borderValue=(235, 240, 246))
    return Image.fromarray(warped)


def _simulate_screen_capture(image: Image.Image) -> Image.Image:
    canvas = Image.new("RGB", (1180, 820), (32, 36, 42))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((42, 42, 1138, 778), radius=18, fill=(245, 247, 250))
    resized = image.resize((1012, 638))
    canvas.paste(resized, (84, 110))
    draw.text((78, 65), "Camera Roll - ID photo", fill=(90, 104, 124), font=_font(24))
    return canvas


def _avg_confidence(response) -> float | None:
    values = [line.confidence for line in response.lines if line.confidence is not None]
    if not values:
        return None
    return round(sum(values) / len(values), 4)


def _name_matches(actual: str | None, expected: str) -> bool:
    if not actual:
        return False
    actual_letters = "".join(ch for ch in actual.upper() if ch.isalnum())
    expected_letters = "".join(ch for ch in expected.upper() if ch.isalnum())
    return expected_letters in actual_letters or actual_letters in expected_letters


def _print_summary(results: list[dict], output_dir: Path) -> None:
    print(f"Generated images: {output_dir}")
    print("variant                 side id  dob name risk   conf  lines warnings")
    print("-" * 92)
    for result in results:
        warnings = ",".join(result["warning_checks"][:3])
        print(
            f"{result['variant']:<23} "
            f"{_mark(result['side_match']):<4} "
            f"{_mark(result['id_match']):<3} "
            f"{_mark(result['dob_match']):<4} "
            f"{_mark(result['name_match']):<4} "
            f"{result['risk_level']:<6} "
            f"{result['avg_confidence'] or 0:<5} "
            f"{result['line_count']:<5} "
            f"{warnings}"
        )


def _mark(value: bool | None) -> str:
    if value is None:
        return "-"
    return "OK" if value else "NO"


if __name__ == "__main__":
    main()

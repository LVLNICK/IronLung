"""Local approximate inference entrypoint for IronLog progress photos.

This mirrors the desktop local-vision-v1 contract. It estimates photo quality
and a user-relative visual progress band. It does not compute attractiveness,
exact body-fat percentage, medical diagnosis, or other-user comparisons.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run future IronLog body progress photo inference.")
    parser.add_argument("--model", type=Path, required=False, help="Future model artifact path.")
    parser.add_argument("--image", type=Path, required=True, help="Local image path.")
    parser.add_argument("--age", type=float, required=False, help="Optional private age context.")
    parser.add_argument("--height", type=float, required=False, help="Optional height in inches.")
    parser.add_argument("--weight", type=float, required=False, help="Optional bodyweight.")
    parser.add_argument("--pose", default="front", choices=["front", "side", "back", "other"])
    parser.add_argument("--lighting", default=None)
    parser.add_argument("--pump", default="no pump")
    return parser.parse_args()


def extract_features(image: Path) -> dict:
    original = Image.open(image).convert("RGB")
    sample = original.resize((128, max(96, int(original.height / original.width * 128))))
    gray = np.asarray(sample.convert("L"), dtype=np.float32)
    mean = float(gray.mean())
    contrast = float(np.clip(gray.std() / 62 * 100, 0, 100))
    exposure = float(np.clip(100 - abs(mean - 132) / 132 * 100, 0, 100))
    edges = np.asarray(sample.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    sharpness = float(np.clip(edges.mean() / 32 * 100, 0, 100))
    h, w = gray.shape
    center = gray[int(h * 0.18):int(h * 0.82), int(w * 0.28):int(w * 0.72)]
    center_balance = float(np.clip((abs(float(center.mean()) - mean) + float(center.std())) / 72 * 100, 0, 100))
    aspect_quality = float(np.clip(100 - abs((original.height / original.width) - 1.33) * 45, 45, 100))
    return {
        "width": original.width,
        "height": original.height,
        "meanLuminance": round(mean / 255 * 100, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "centerBalance": round(center_balance, 2),
        "exposureBalance": round(exposure, 2),
        "aspectQuality": round(aspect_quality, 2),
    }


def infer_local(args: argparse.Namespace) -> dict:
    features = extract_features(args.image)
    image_quality = (
        features["exposureBalance"] * 0.22
        + features["contrast"] * 0.18
        + features["sharpness"] * 0.20
        + features["centerBalance"] * 0.22
        + features["aspectQuality"] * 0.10
        + min(100, max(35, (features["width"] * features["height"] / 1_200_000) * 100)) * 0.08
    )
    pose_score = 52 if args.pose == "other" else 76
    context_score = 80 if args.lighting else 48
    pump_penalty = 4 if args.pump == "pump" else 0
    score = round(max(0, min(100, image_quality * 0.62 + pose_score * 0.23 + context_score * 0.15 - pump_penalty)), 2)
    confidence = round(max(0, min(0.92, image_quality / 100 * 0.58 + (0.18 if args.lighting else 0.04) + (0.04 if args.pose == "other" else 0.16))), 2)
    approximate_bmi = None
    if args.height and args.weight:
        approximate_bmi = round(args.weight / (args.height * args.height) * 703, 2)

    return {
        "score": score,
        "confidence": confidence,
        "modelVersion": "python-local-vision-v1",
        "measurementsJson": {
            "photoQualitySignals": features,
            "captureContext": {
                "age": args.age,
                "height": args.height,
                "bodyweight": args.weight,
                "approximateBmi": approximate_bmi,
                "poseType": args.pose,
                "lightingTag": args.lighting or "unknown",
                "pumpTag": args.pump,
            },
            "approximateVisualComposition": {
                "label": "Rough visual composition/progress band, not body-fat percentage",
                "approximateOnly": True,
            },
            "forbiddenOutputs": {
                "attractiveness": "not_computed",
                "exactBodyFatPercentage": "not_computed",
                "medicalDiagnosis": "not_computed",
            },
        },
        "warningsJson": [
            "Approximate private progress metric only.",
            "Not a medical diagnosis, exact body-fat measurement, or attractiveness rating.",
            "No comparison is made against other users.",
        ],
    }


def main() -> None:
    args = parse_args()
    if not args.image.exists():
        raise SystemExit(f"Image does not exist: {args.image}")
    print(json.dumps(infer_local(args), indent=2))


if __name__ == "__main__":
    main()

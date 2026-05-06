"""Future training entrypoint for IronLung body progress photo analysis.

The MVP does not train or ship a model. This script is intentionally a scaffold
with safety-oriented checks so future work starts from the right interface.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train a future IronLung photo consistency/progress model.")
    parser.add_argument("--data-dir", type=Path, required=True, help="Directory containing user-provided, licensed datasets.")
    parser.add_argument("--output", type=Path, required=True, help="Output model artifact path, e.g. artifacts/model.onnx.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.data_dir.exists():
      raise SystemExit(f"Dataset directory does not exist: {args.data_dir}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    print("IronLung ML scaffold")
    print(f"Dataset directory: {args.data_dir}")
    print(f"Planned output: {args.output}")
    print("No model is trained in the MVP scaffold.")
    print("Before training, document dataset consent, license, bias risks, and harmful-label exclusions.")


if __name__ == "__main__":
    main()
